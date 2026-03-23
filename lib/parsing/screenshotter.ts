// ─── Page Screenshotter ───────────────────────────────────────────────────────
// Captures a rendered screenshot of a page (above the fold).
// Uses @sparticuz/chromium + puppeteer-core for Vercel serverless compatibility.
// Falls back gracefully to null on any error — pipeline works without it.

import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

const VIEWPORT = { width: 1280, height: 800 };
const NAV_TIMEOUT_MS = 20000;
const RENDER_SETTLE_MS = 1200; // brief wait after DOMContentLoaded for CSS/fonts

export async function captureScreenshot(url: string): Promise<string | null> {
  let browser = null;
  try {
    const executablePath =
      process.env.PUPPETEER_EXECUTABLE_PATH ||
      (await chromium.executablePath());

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: VIEWPORT,
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(NAV_TIMEOUT_MS);

    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Let above-fold CSS, fonts, and hero images settle
    await new Promise((resolve) => setTimeout(resolve, RENDER_SETTLE_MS));

    const buffer = await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
    });

    console.log(`[screenshotter] Captured above-fold screenshot for: ${url}`);
    return Buffer.from(buffer).toString("base64");
  } catch (err) {
    // Non-fatal: diagnosis continues with text-only context
    console.warn(
      `[screenshotter] Screenshot failed for ${url}:`,
      err instanceof Error ? err.message : err
    );
    return null;
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
