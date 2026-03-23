import Anthropic from "@anthropic-ai/sdk";
import type {
  PageSnapshot,
  Submission,
  Report,
  DiagnosisIssue,
  DiagnosisSection,
  PipelineMeta,
  IssueArchetypeId,
  RubricDimension,
  IssueSeverity,
} from "@/lib/types";
import {
  ClassificationOutputSchema,
  IssueIdentificationOutputSchema,
  ScoringOutputSchema,
  RewriteOutputSchema,
  SynthesisOutputSchema,
} from "./schemas";
import {
  buildClassificationPrompt,
  buildIssueIdentificationPrompt,
  buildScoringPrompt,
  buildRewritePrompt,
  buildSynthesisPrompt,
} from "./prompts";
import {
  RUBRIC_DIMENSIONS,
  scoreToTier,
  computeOverallScore,
} from "@/lib/knowledge/diagnosis-rubric";

const MODEL = "claude-sonnet-4-6";

function getClient(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey: key });
}

// ─── Stage Runner ─────────────────────────────────────────────────────────────

// Visual context note injected into system prompt when a screenshot is available
const VISUAL_CONTEXT_ADDENDUM = `
VISUAL CONTEXT (screenshot provided):
A rendered screenshot of the page above the fold is included as an image in this request.
- Treat the screenshot as ground truth for visual element presence and prominence
- If an element is clearly visible in the screenshot but absent from extracted text, prioritize what you see
- Distinguish between: element visible and prominent / visible but small or easy to miss / not visible in screenshot
- Use what you observe in the screenshot to validate or correct claims made from text extraction alone`;

async function runStage<T>(
  client: Anthropic,
  system: string,
  user: string,
  schema: { parse: (data: unknown) => T },
  stageName: string,
  screenshotBase64?: string | null
): Promise<{ output: T; duration_ms: number; tokens_used: number }> {
  const start = Date.now();

  const systemWithContext = screenshotBase64
    ? `${system}${VISUAL_CONTEXT_ADDENDUM}`
    : system;

  const messageContent = screenshotBase64
    ? [
        {
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: "image/png" as const,
            data: screenshotBase64,
          },
        },
        { type: "text" as const, text: user },
      ]
    : user;

  const payload = {
    model: MODEL,
    max_tokens: 4096,
    temperature: 0,
    system: systemWithContext,
    messages: [{ role: "user" as const, content: messageContent }],
  };
  console.log(
    `[pipeline] SENDING TO ANTHROPIC — stage: ${stageName} | model: ${payload.model} | system: ${systemWithContext.length}c | screenshot: ${screenshotBase64 ? "yes" : "no"}`
  );

  let response: Awaited<ReturnType<typeof client.messages.create>>;
  try {
    response = await client.messages.create(payload);
    console.log(`[pipeline] ANTHROPIC RESPONSE RECEIVED — stage: ${stageName}`);
  } catch (err) {
    console.error(`[pipeline] ANTHROPIC ERROR — stage: ${stageName}:`, err);
    throw err;
  }

  const duration_ms = Date.now() - start;
  const tokens_used =
    response.usage.input_tokens + response.usage.output_tokens;

  const rawText =
    response.content[0]?.type === "text" ? response.content[0].text : "";

  // Strip markdown fences if the model wraps in them
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```$/m, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      `Stage "${stageName}" returned invalid JSON. Raw response:\n${rawText.slice(0, 500)}`
    );
  }

  try {
    const output = schema.parse(parsed);
    return { output, duration_ms, tokens_used };
  } catch (err) {
    throw new Error(
      `Stage "${stageName}" output failed validation: ${String(err)}\nRaw: ${rawText.slice(0, 500)}`
    );
  }
}

// ─── Main Pipeline ────────────────────────────────────────────────────────────

export interface AnalysisJson {
  url: string;
  page_type: string;
  dominant_issue: string;
  core_problem: string;
  intent: string | null;
  reality: string | null;
  primary_blocker: {
    title: string;
    observation: string;
    recommended_change: string;
    evidence: string | null;
  } | null;
  supporting_blockers: Array<{
    title: string;
    observation: string;
    recommended_change: string;
    evidence: string | null;
  }>;
  fix_first: string;
  cta_transition: string;
  visitor_journey: string[];
  cta_texts: string[];
  whats_working: string[];
  overall_score: number;
  tier: string;
}

export async function runDiagnosisPipeline(
  snapshot: PageSnapshot,
  submission: Submission,
  screenshotBase64?: string | null
): Promise<{ report: Report; analysisJson: AnalysisJson }> {
  const client = getClient();
  const pipelineStart = Date.now();
  const stages: PipelineMeta["stages"] = [];

  // ── Stage 1: Classify page type ──────────────────────────────────────────

  const classifyPrompts = buildClassificationPrompt(snapshot, submission);
  const classifyResult = await runStage(
    client,
    classifyPrompts.system,
    classifyPrompts.user,
    ClassificationOutputSchema,
    "classify",
    screenshotBase64
  );
  stages.push({
    stage: "classify",
    duration_ms: classifyResult.duration_ms,
    tokens_used: classifyResult.tokens_used,
  });

  const pageType = classifyResult.output.page_type;
  const dominantCategory = classifyResult.output.dominant_category;
  const primaryAudience = classifyResult.output.primary_audience;
  const inferredGoal = classifyResult.output.inferred_goal;
  const strongestStrategicAngle = classifyResult.output.strongest_strategic_angle;

  // ── Stage 2: Identify issues ──────────────────────────────────────────────

  const issuePrompts = buildIssueIdentificationPrompt(
    snapshot,
    { ...submission, page_type: pageType },
    pageType,
    dominantCategory,
    primaryAudience,
    inferredGoal,
    strongestStrategicAngle
  );
  const issueResult = await runStage(
    client,
    issuePrompts.system,
    issuePrompts.user,
    IssueIdentificationOutputSchema,
    "identify_issues",
    screenshotBase64
  );
  stages.push({
    stage: "identify_issues",
    duration_ms: issueResult.duration_ms,
    tokens_used: issueResult.tokens_used,
  });

  const rawIssues = issueResult.output.issues;
  const whatsWorking = issueResult.output.whats_working;

  // ── Stages 3 + 4: Score and rewrite in parallel ───────────────────────────
  // Neither depends on the other — both only need rawIssues from stage 2.

  const scorePrompts = buildScoringPrompt(rawIssues, snapshot);
  const rewritePrompts = buildRewritePrompt(rawIssues, snapshot);

  const [scoreResult, rewriteResult] = await Promise.all([
    runStage(client, scorePrompts.system, scorePrompts.user, ScoringOutputSchema, "score"),
    runStage(client, rewritePrompts.system, rewritePrompts.user, RewriteOutputSchema, "generate_rewrites"),
  ]);

  stages.push(
    { stage: "score", duration_ms: scoreResult.duration_ms, tokens_used: scoreResult.tokens_used },
    { stage: "generate_rewrites", duration_ms: rewriteResult.duration_ms, tokens_used: rewriteResult.tokens_used }
  );

  const dimensionScoreMap: Partial<Record<RubricDimension, number>> = {};
  for (const ds of scoreResult.output.dimension_scores) {
    dimensionScoreMap[ds.dimension as RubricDimension] = ds.score;
  }
  const overallScore = computeOverallScore(dimensionScoreMap);
  const tier = scoreToTier(overallScore);

  // Build rewrite map by archetype_id
  const rewriteMap: Record<string, string> = {};
  for (const rw of rewriteResult.output.rewrites) {
    rewriteMap[rw.archetype_id] = rw.rewrite;
  }

  // ── Stage 5: Synthesize summary ───────────────────────────────────────────

  const synthPrompts = buildSynthesisPrompt(
    rawIssues,
    overallScore,
    tier,
    whatsWorking,
    snapshot,
    submission,
    dominantCategory,
    primaryAudience,
    inferredGoal,
    strongestStrategicAngle
  );
  const synthResult = await runStage(
    client,
    synthPrompts.system,
    synthPrompts.user,
    SynthesisOutputSchema,
    "synthesize",
    screenshotBase64
  );
  stages.push({
    stage: "synthesize",
    duration_ms: synthResult.duration_ms,
    tokens_used: synthResult.tokens_used,
  });

  // ── Assemble final issues with rewrites ───────────────────────────────────

  const fullIssues: DiagnosisIssue[] = rawIssues.map((raw) => ({
    archetype_id: raw.archetype_id as IssueArchetypeId,
    severity: raw.severity as IssueSeverity,
    dimension: raw.dimension as RubricDimension,
    title: raw.title,
    prose: raw.prose,
    observation: raw.observation,
    root_cause: raw.root_cause ?? null,
    why_it_matters: raw.why_it_matters,
    recommended_change: raw.recommended_change,
    rewrite: rewriteMap[raw.archetype_id] ?? null,
    evidence: raw.evidence ?? null,
  }));

  // V1 hard limits: 1 primary blocker, max 2 supporting blockers, no polish tier
  const tier1_blockers = fullIssues.filter((i) => i.severity === "critical").slice(0, 1);
  const tier2_friction = fullIssues.filter((i) => i.severity === "high").slice(0, 2);
  const tier3_polish: typeof fullIssues = [];

  // ── Assemble dimension sections ───────────────────────────────────────────

  const sections: DiagnosisSection[] = scoreResult.output.dimension_scores.map((ds) => {
    const dimDef = RUBRIC_DIMENSIONS[ds.dimension as RubricDimension];
    const dimensionIssues = fullIssues.filter((i) => i.dimension === ds.dimension);

    return {
      dimension: ds.dimension as RubricDimension,
      label: dimDef?.label ?? ds.dimension,
      score: ds.score,
      issues: dimensionIssues,
      summary: ds.summary,
    };
  });

  // ── Build final report ────────────────────────────────────────────────────

  const pipelineMeta: PipelineMeta = {
    stages,
    total_duration_ms: Date.now() - pipelineStart,
    model: MODEL,
  };

  const report: Omit<Report, "id" | "created_at"> = {
    submission_id: submission.id,
    overall_score: overallScore,
    tier,
    title: synthResult.output.title,
    executive_summary: synthResult.output.executive_summary,
    core_problem: synthResult.output.core_problem,
    visitor_journey: synthResult.output.visitor_journey,
    problem_type: synthResult.output.problem_type,
    whats_working: whatsWorking,
    tier1_blockers,
    tier2_friction,
    tier3_polish,
    intent_vs_reality: synthResult.output.intent_vs_reality ?? null,
    fix_first: synthResult.output.fix_first,
    cta_transition: synthResult.output.cta_transition,
    primary_direction: rewriteResult.output.primary_direction,
    strategic_note: synthResult.output.strategic_note,
    sections,
    pipeline_meta: pipelineMeta,
    flagged: false,
    flag_note: null,
  };

  const analysisJson: AnalysisJson = {
    url: submission.url,
    page_type: pageType,
    dominant_issue: dominantCategory,
    core_problem: synthResult.output.core_problem,
    intent: synthResult.output.intent_vs_reality?.intent ?? null,
    reality: synthResult.output.intent_vs_reality?.reality ?? null,
    primary_blocker: tier1_blockers[0]
      ? {
          title: tier1_blockers[0].title,
          observation: tier1_blockers[0].observation,
          recommended_change: tier1_blockers[0].recommended_change,
          evidence: tier1_blockers[0].evidence,
        }
      : null,
    supporting_blockers: tier2_friction.map((b) => ({
      title: b.title,
      observation: b.observation,
      recommended_change: b.recommended_change,
      evidence: b.evidence,
    })),
    fix_first: synthResult.output.fix_first,
    cta_transition: synthResult.output.cta_transition,
    visitor_journey: synthResult.output.visitor_journey,
    cta_texts: snapshot.cta_texts,
    whats_working: whatsWorking,
    overall_score: overallScore,
    tier,
  };

  return { report: report as Report, analysisJson };
}
