import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "../backend-fetch";

export async function POST(request: NextRequest) {
  const { email, recaptcha_token } = await request.json();

  if (!email) {
    return NextResponse.json({ message: "Email é obrigatório" }, { status: 400 });
  }

  // Get CSRF token from backend, using the client's existing session cookies
  let csrfToken: string;
  let sessionCookies: string;
  try {
    const existingCookies = request.headers.get("cookie") || "";
    const csrfRes = await backendFetch("/get-csrf", {
      headers: { Cookie: existingCookies },
    });
    if (!csrfRes.ok) {
      return NextResponse.json({ message: "Erro ao obter token de segurança" }, { status: 502 });
    }
    const csrfData = await csrfRes.json();
    csrfToken = csrfData?.response?.csrf_token;
    if (!csrfToken) {
      return NextResponse.json({ message: "Token de segurança inválido" }, { status: 502 });
    }
    // Merge any new session cookies set by /get-csrf with the client cookies
    const newCookies = csrfRes.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
    sessionCookies = [existingCookies, newCookies].filter(Boolean).join("; ");
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
