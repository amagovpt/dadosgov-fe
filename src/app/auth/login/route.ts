import { NextRequest, NextResponse } from "next/server";
import { backendFetch, forwardedHeaders } from "../../backend-fetch";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const forwarded = forwardedHeaders(request);

  // Mint the CSRF token + session cookie server-side and send ONLY that fresh
  // session to the backend. Do NOT forward the client's existing cookies: a
  // SAML/CMD session cookie carries no `csrf_token`, so when it shadows (or is
  // sent alongside) the /get-csrf session, Flask-WTF validates against the
  // wrong session and POST /login/ returns 400 "CSRF token is missing" — which
  // surfaces as a bogus "invalid credentials" error. The /reset-password and
  // /reset routes already use this same self-contained pattern for the same
  // reason; the login route was missing it.
  let csrfToken: string;
  let sessionCookie: string;
  try {
    const csrfRes = await backendFetch("/get-csrf", { cache: "no-store", headers: forwarded });
    if (!csrfRes.ok) {
      return NextResponse.json({ message: "Erro ao obter token de segurança" }, { status: 502 });
    }
    const csrfData = await csrfRes.json();
    csrfToken = csrfData?.response?.csrf_token;
    if (!csrfToken) {
      return NextResponse.json({ message: "Token de segurança inválido" }, { status: 502 });
    }
    // Use only the fresh session cookie returned by /get-csrf (it always contains csrf_token)
    sessionCookie = csrfRes.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
  } catch {
    return NextResponse.json({ message: "Backend unavailable" }, { status: 502 });
  }

  // Rebuild the login body with the freshly-minted CSRF token, ignoring any
  // token the client may have sent (it was bound to the browser's session,
  // not to the fresh /get-csrf session we send below).
  const params = new URLSearchParams(rawBody);
  params.set("csrf_token", csrfToken);

  let backendResponse: Response;
  try {
    backendResponse = await backendFetch("/login/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: sessionCookie,
        ...forwarded,
      },
      body: params.toString(),
      redirect: "manual",
    });
  } catch {
    return NextResponse.json({ message: "Backend unavailable" }, { status: 502 });
  }

  const responseHeaders = new Headers();

  // Forward Set-Cookie headers from backend, stripping Domain so cookies
  // are scoped to the frontend origin (not the backend's domain)
  const setCookies = backendResponse.headers.getSetCookie();
  for (const cookie of setCookies) {
    const cleaned = cookie.replace(/;\s*Domain=[^;]*/i, "");
    responseHeaders.append("Set-Cookie", cleaned);
  }

  // 302 = backend redirect (could be success or failed login redirecting back to /login/)
  if (backendResponse.status === 302) {
    const redirectLocation = backendResponse.headers.get("location") || "/";

    // If backend redirects back to /login/, credentials were invalid
    if (redirectLocation.includes("/login")) {
      responseHeaders.set("Content-Type", "application/json");
      return NextResponse.json(
        { message: "Autenticação falhada - E-mail ou senha/código inválido" },
        { status: 401, headers: responseHeaders }
      );
    }

    // Use the authenticated session cookie returned by the login response for
    // the migration check / logout calls. We no longer forward the client's
    // original cookies (see CSRF note above), so the authenticated session is
    // whatever /login/ just set.
    const authCookies = setCookies.map((c) => c.split(";")[0]).join("; ");

    // Check if this is a legacy user that needs CMD migration
    try {
      const checkResponse = await backendFetch("/saml/migration/check", {
        headers: { Cookie: authCookies, ...forwarded },
      });

      if (checkResponse.ok) {
        const checkData = await checkResponse.json();

        if (checkData.needs_migration) {
          // Log the user out — they must migrate via CMD first
          await backendFetch("/logout/", {
            headers: { Cookie: authCookies, ...forwarded },
            redirect: "manual",
          });

          responseHeaders.set("Content-Type", "application/json");
          return NextResponse.json(
            {
              message: "migration_required",
              redirect: "/pages/login",
            },
            { status: 403, headers: responseHeaders }
          );
        }
      }
    } catch {
      // If check fails, allow login to proceed normally
    }

    responseHeaders.set("Content-Type", "application/json");
    return NextResponse.json(
      { message: "Login successful", redirect: backendResponse.headers.get("location") || "/" },
      { status: 200, headers: responseHeaders }
    );
  }

  // Login failed — backend returned non-302 (e.g. 200 with re-rendered form or 400)
  const responseBody = await backendResponse.text();

  // Try to extract error from HTML form response
  const errorMatch = responseBody.match(/class="help-block">([^<]+)</);
  const errorMessage = errorMatch
    ? errorMatch[1].trim()
    : "Autenticação falhada - E-mail ou senha/código inválido";

  responseHeaders.set("Content-Type", "application/json");
  return NextResponse.json(
    { message: errorMessage },
    { status: 401, headers: responseHeaders }
  );
}
