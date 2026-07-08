import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "../../backend-fetch";

export async function POST(request: NextRequest) {
  const { email, recaptcha_token } = await request.json();

  if (!email) {
    return NextResponse.json({ message: "Email é obrigatório" }, { status: 400 });
  }

  // Use a fresh session for the CSRF token — do not forward the client's existing session.
  // A SAML-authenticated session lacks csrf_token; merging it with the /get-csrf session
  // would send duplicate session cookies, Flask would pick the old one (no csrf_token),
  // and the CSRF check on POST /reset/ would return 400.
  let csrfToken: string;
  let sessionCookies: string;
  try {
    const csrfRes = await backendFetch("/get-csrf");
    if (!csrfRes.ok) {
      return NextResponse.json({ message: "Erro ao obter token de segurança" }, { status: 502 });
    }
    const csrfData = await csrfRes.json();
    csrfToken = csrfData?.response?.csrf_token;
    if (!csrfToken) {
      return NextResponse.json({ message: "Token de segurança inválido" }, { status: 502 });
    }
    // Use only the fresh session cookie returned by /get-csrf (it always contains csrf_token)
    sessionCookies = csrfRes.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
  } catch {
    return NextResponse.json({ message: "Backend indisponível" }, { status: 502 });
  }

  const body = new URLSearchParams({
    email,
    csrf_token: csrfToken,
    ...(recaptcha_token ? { recaptcha_token } : {}),
    submit: "true",
  });

  let backendResponse: Response;
  try {
    backendResponse = await backendFetch("/reset/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: sessionCookies,
      },
      body: body.toString(),
      redirect: "manual",
    });
  } catch {
    return NextResponse.json({ message: "Backend indisponível" }, { status: 502 });
  }

  // Flask-Security with RETURN_GENERIC_RESPONSES always returns 200 (anti-enumeration).
  // Treat 200 as success; only fail on server errors (4xx/5xx).
  if (backendResponse.status === 200) {
    return NextResponse.json({ message: "success" }, { status: 200 });
  }

  return NextResponse.json(
    { message: "Erro ao enviar pedido de recuperação. Tente novamente." },
    { status: 400 }
  );
}
