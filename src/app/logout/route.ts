import { NextRequest, NextResponse } from "next/server";
import { backendFetch, forwardedHeaders } from "../backend-fetch";

export async function GET(request: NextRequest) {
  let backendResponse: Response;
  try {
    backendResponse = await backendFetch("/logout/", {
      method: "GET",
      headers: {
        Cookie: request.headers.get("cookie") || "",
        ...forwardedHeaders(request),
      },
      redirect: "manual",
    });
  } catch {
    return NextResponse.json({ message: "Backend unavailable" }, { status: 502 });
  }

  // Strip Domain from Set-Cookie headers so they match the host-only cookies
  // that were originally set by the login route handler (which also strips Domain).
  // Without this, the browser ignores the deletion because the Domain doesn't match.
  const responseHeaders = new Headers();
  const setCookies = backendResponse.headers.getSetCookie();
  for (const cookie of setCookies) {
    const cleaned = cookie.replace(/;\s*Domain=[^;]*/i, "");
    responseHeaders.append("Set-Cookie", cleaned);
  }

  // The backend replies 302 with an absolute Location on its own host
  // (e.g. https://<backend>/?flash=logout). Forwarding that redirect makes the
  // client-side fetch() follow it cross-origin and fail CORS, so logout()
  // throws and the UI never updates. Mirror the login route handler instead:
  // convert the redirect into a 200 JSON response carrying the Set-Cookie
  // headers — the caller handles navigation itself.
  if (backendResponse.status === 302) {
    responseHeaders.set("Content-Type", "application/json");
    return NextResponse.json(
      { message: "Logout successful" },
      { status: 200, headers: responseHeaders }
    );
  }

  return new NextResponse(null, { status: backendResponse.status, headers: responseHeaders });
}
