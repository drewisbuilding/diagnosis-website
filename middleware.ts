import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const secret = process.env.ADMIN_SECRET;

  // No secret configured — block in production, allow in dev
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("Forbidden — ADMIN_SECRET is not configured.", {
        status: 403,
      });
    }
    return NextResponse.next();
  }

  // Accept secret via ?secret= query param or Authorization: Bearer <token>
  const queryToken = request.nextUrl.searchParams.get("secret");
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const token = queryToken ?? bearerToken;

  if (token !== secret) {
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:system-ui;padding:2rem;color:#1c1917">
        <h2>Admin access required</h2>
        <p>Pass your admin secret as <code>?secret=YOUR_SECRET</code></p>
      </body></html>`,
      { status: 401, headers: { "Content-Type": "text/html" } }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
