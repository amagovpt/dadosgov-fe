import { NextRequest, NextResponse } from "next/server";
import { backendFetch, forwardedHeaders } from "../backend-fetch";

// Merge Set-Cookie name=value pairs from a backend response over an existing
// Cookie header, so the value the backend just updated (e.g. the session with a
// freshly-minted CSRF secret) wins while every other cookie is preserved.
function mergeCookies(original: string, setCookies: string[]): string {
  const jar = new Map<string, string>();
  for (const part of original.split(";")) {
    const trimmed = part.trim();
    const idx = trimmed.indexOf("=");
    if (idx > 0) jar.set(trimmed.slice(0, idx), trimmed.slice(idx + 1));
  }
  for (const sc of setCookies) {
    const first = sc.split(";")[0];
    const idx = first.indexOf("=");
    if (idx > 0) jar.set(first.slice(0, idx).trim(), first.slice(idx + 1));
  }
  return [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
}

// Proxy for Flask-Security's change-password view (SECURITY_CHANGE_URL = "/change/").
// Without this handler the client POST to /change lands on Next.js (no page/rewrite)
// and gets the 404 HTML page, which the frontend fails to parse as JSON
// ("Unexpected token '<', "<!DOCTYPE "...").
//
// The view is @login_required, so the CSRF token MUST be bound to the caller's
// authenticated session. The previous client flow (fetchCsrfToken → /csrf) minted
// the token in a fresh ANONYMOUS session whose Set-Cookie overwrote the browser's
// authenticated session, so the change POST arrived unauthenticated and was bounced
// to /login. This handler mints the token server-side against the forwarded
// authenticated cookie instead — the same self-contained pattern as /login — so the
// session is preserved. The X-Forwarded-* + rebuilt Referer headers (relayed via
// forwardedHeaders) are required in PRD over https/F5-WAF to avoid spurious 429s and
// the WTF_CSRF_SSL_STRICT "referrer header is missing" 400.
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const forwarded = forwardedHeaders(request);
  const cookie = request.headers.get("cookie") || "";
  const contentType =
    request.headers.get("content-type") || "application/x-www-form-urlencoded";

  // Mint a CSRF token inside the caller's authenticated session.
  let csrfToken: string;
  let postCookie = cookie;
  try {
    const csrfRes = await backendFetch("/get-csrf", {
      cache: "no-store",
      headers: { Cookie: cookie, ...forwarded },
    });
    if (!csrfRes.ok) {
      return NextResponse.json(
        { message: "Erro ao obter token de segurança" },
        { status: 502 }
      );
    }
    const csrfData = await csrfRes.json();
    csrfToken = csrfData?.response?.csrf_token;
    if (!csrfToken) {
      return NextResponse.json({ message: "Token de segurança inválido" }, { status: 502 });
    }
    // /get-csrf adds the secret to the existing session; carry the updated cookie.
    postCookie = mergeCookies(cookie, csrfRes.headers.getSetCookie());
  } catch {
    return NextResponse.json({ message: "Backend unavailable" }, { status: 502 });
  }

  // Rebuild the body with the freshly-minted token, ignoring any token the client
  // may have sent (it was bound to a different session).
  const params = new URLSearchParams(rawBody);
  params.set("csrf_token", csrfToken);

  let backendResponse: Response;
  try {
    backendResponse = await backendFetch("/change/", {
      method: "POST",
      headers: {
        "Content-Type": contentType,
        Cookie: postCookie,
        ...forwarded,
      },
      body: params.toString(),
      redirect: "manual",
    });
  } catch {
    return NextResponse.json({ message: "Backend unavailable" }, { status: 502 });
  }

  const responseHeaders = new Headers();

  // Forward Set-Cookie headers from backend (the session is re-issued after a
  // successful password change), stripping Domain so cookies stay scoped to the
  // frontend origin.
  for (const cookieHeader of backendResponse.headers.getSetCookie()) {
    responseHeaders.append("Set-Cookie", cookieHeader.replace(/;\s*Domain=[^;]*/i, ""));
  }

  responseHeaders.set("Content-Type", "application/json");

  // The backend answers a POST with a 302 redirect. The location disambiguates
  // the outcome: an unauthenticated/expired session is bounced to
  // /login/?next=/change/ by @login_required, whereas a real password change
  // redirects to the post-change view (homepage). Treating every 302 as success
  // would report a false "password changed" when the session is gone.
  if (backendResponse.status === 302) {
    const location = backendResponse.headers.get("location") || "";
    if (location.includes("/login")) {
      return NextResponse.json(
        { message: "A sessão expirou. Inicie sessão novamente para alterar a senha." },
        { status: 401, headers: responseHeaders }
      );
    }
    return NextResponse.json(
      { message: "Senha alterada com sucesso." },
      { status: 200, headers: responseHeaders }
    );
  }

  // Validation error — Flask-Security re-renders the form. Note it does so with
  // HTTP 200, so we must coerce to a 4xx here: the frontend only throws on
  // `!res.ok`, and forwarding the 200 would surface a wrong password as success.
  const responseBody = await backendResponse.text();
  const errorMatch = responseBody.match(/class="help-block">([^<]+)</);
  const errorMessage = errorMatch
    ? errorMatch[1].trim()
    : "Erro ao alterar a senha. Verifique os dados e tente novamente.";

  const status = backendResponse.status >= 400 ? backendResponse.status : 400;
  return NextResponse.json({ message: errorMessage }, { status, headers: responseHeaders });
}
