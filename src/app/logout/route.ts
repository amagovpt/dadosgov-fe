import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "../backend-fetch";

export async function GET(request: NextRequest) {
  let backendResponse: Response;
  try {
    backendResponse = await backendFetch("/logout/", {
      method: "GET",
      headers: {
        Cookie: request.headers.get("cookie") || "",
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

  const location = backendResponse.headers.get("location");
  if (backendResponse.status === 302 && location) {
    return NextResponse.redirect(new URL(location, request.url), {
      status: 302,
      headers: responseHeaders,
    });
  }

  return new NextResponse(null, { status: backendResponse.status, headers: responseHeaders });
}
