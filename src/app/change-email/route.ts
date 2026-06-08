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

// Proxy for Flask-Security's change-email view (SECURITY_CHANGE_EMAIL_URL =
// "/change-email"). Like /change, the view is @login_required, so the CSRF token
// MUST be bound to the caller's authenticated session. The previous client flow
// (fetchCsrfToken → /csrf) minted the token in a fresh ANONYMOUS session whose
// Set-Cookie overwrote the browser's authenticated session, so the request
// arrived unauthenticated and Flask-Security bounced it to /login — which the old
// "treat every 302 as success" handler reported as a (false) confirmation_sent.
// Mint the token server-side against the forwarded authenticated cookie instead,
// and disambiguate the 302 by its location.
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
    postCookie = mergeCookies(cookie, csrfRes.headers.getSetCookie());
  } catch {
    return NextResponse.json({ message: "Backend unavailable" }, { status: 502 });
  }

  // Rebuild the body with the freshly-minted token, ignoring any client token.
  const params = new URLSearchParams(rawBody);
  params.set("csrf_token", csrfToken);

  let backendResponse: Response;
  try {
    backendResponse = await backendFetch("/change-email", {
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

  // Forward Set-Cookie headers from backend, stripping Domain so cookies stay
  // scoped to the frontend origin.
  for (const cookieHeader of backendResponse.headers.getSetCookie()) {
    responseHeaders.append("Set-Cookie", cookieHeader.replace(/;\s*Domain=[^;]*/i, ""));
  }

  responseHeaders.set("Content-Type", "application/json");

  // A real change-email redirects to the post-change view (homepage) after
  // sending the confirmation email; an unauthenticated/expired session is
  // bounced to /login by @login_required. Treating every 302 as success would
  // report a false "confirmation sent" when the session is gone.
  if (backendResponse.status === 302) {
    const location = backendResponse.headers.get("location") || "";
    if (location.includes("/login")) {
      return NextResponse.json(
        { message: "A sessão expirou. Inicie sessão novamente para alterar o e-mail." },
        { status: 401, headers: responseHeaders }
      );
    }
    return NextResponse.json(
      { message: "confirmation_sent" },
      { status: 200, headers: responseHeaders }
    );
  }

  // Validation error — Flask-Security re-renders the form with HTTP 200, so we
  // must coerce to a 4xx: the frontend only throws on !res.ok, and forwarding the
  // 200 would surface an invalid address as success.
  const responseBody = await backendResponse.text();
  const errorMatch = responseBody.match(/class="help-block">([^<]+)</);
  const errorMessage = errorMatch
    ? errorMatch[1].trim()
    : "Erro ao solicitar a alteração de e-mail. Verifique o endereço e tente novamente.";

  const status = backendResponse.status >= 400 ? backendResponse.status : 400;
  return NextResponse.json({ message: errorMessage }, { status, headers: responseHeaders });
}
