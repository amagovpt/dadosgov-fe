import { NextRequest, NextResponse } from "next/server";
import { backendFetch, forwardedHeaders } from "../backend-fetch";

/**
 * Proxies `GET /me` to the backend `/api/1/me/` endpoint.
 *
 * The previous implementation collapsed any non-2xx backend response into
 * `401 + null`, which masked redirect chains, validation failures and
 * upstream errors during retest (LEDG-1736). We now forward the actual
 * status and body, and mirror the Set-Cookie handling already used by the
 * sibling `/login` and `/logout` route handlers — strip the `Domain`
 * attribute so the cookie is scoped to the frontend origin.
 *
 * Also forwards `X-Forwarded-For`/`X-Forwarded-Host`/`X-Forwarded-Proto` (via
 * `forwardedHeaders`) so Flask's `ProxyFix` middleware sees the original client
 * IP and context instead of `localhost:7000` (which is what `backendFetch`
 * resolves to internally). Without the real client IP the IP-keyed rate limiter
 * collapses every user into one bucket and returns spurious 429s on `/me`.
 */
export async function GET(request: NextRequest) {
  const cookies = request.headers.get("cookie") || "";

  let backendResponse: Response;
  try {
    backendResponse = await backendFetch("/api/1/me/", {
      headers: {
        Cookie: cookies,
        Accept: "application/json",
        ...forwardedHeaders(request),
      },
      redirect: "manual",
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ message: "Backend unavailable" }, { status: 502 });
  }

  const responseHeaders = new Headers();

  // Forward Set-Cookie headers from backend, stripping Domain so cookies
  // are scoped to the frontend origin. Mirrors src/app/login/route.ts.
  const setCookies = backendResponse.headers.getSetCookie();
  for (const cookie of setCookies) {
    const cleaned = cookie.replace(/;\s*Domain=[^;]*/i, "");
    responseHeaders.append("Set-Cookie", cleaned);
  }

  const contentType = backendResponse.headers.get("Content-Type");
  if (contentType) {
    responseHeaders.set("Content-Type", contentType);
  }

  const body = await backendResponse.text();
  return new NextResponse(body || null, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
}
