import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware that sets X-Forwarded-Host on API and backend-proxied requests.
 *
 * When the frontend runs in Docker, Next.js rewrites send requests to the
 * backend via `host.docker.internal`. Flask uses ProxyFix(x_host=1) and
 * compares the Host header against SERVER_NAME. Without this middleware
 * the Host header would be `localhost:3000` (from the browser) instead of
 * `localhost:7000` (what Flask expects), causing silent auth failures.
 *
 * We read BACKEND_HOST from the environment (defaults to SERVER_NAME-style
 * value) and inject it as X-Forwarded-Host so Flask sees the correct host.
 */

const BACKEND_HOST = process.env.BACKEND_HOST || "";

export function proxy(request: NextRequest) {
  if (!BACKEND_HOST) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("X-Forwarded-Host", BACKEND_HOST);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/api/:path*", "/saml/:path*", "/logout/:path*", "/get-csrf"],
};
