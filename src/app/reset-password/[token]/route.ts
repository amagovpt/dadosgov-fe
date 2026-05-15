import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "../../backend-fetch";

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { password, password_confirm } = await request.json();

  if (!password || !password_confirm) {
    return NextResponse.json({ message: "Preencha todos os campos obrigatórios" }, { status: 400 });
  }

  // Get CSRF token + session cookie from backend
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
    const newCookies = csrfRes.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
    sessionCookies = [existingCookies, newCookies].filter(Boolean).join("; ");
  } catch {
    return NextResponse.json({ message: "Backend indisponível" }, { status: 502 });
  }

  const body = new URLSearchParams({
    password,
    password_confirm,
    csrf_token: csrfToken,
  });

  let backendResponse: Response;
  try {
    backendResponse = await backendFetch(`/reset/${token}/`, {
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

  // Success: backend redirects after password reset
  if (backendResponse.status === 302) {
    return NextResponse.json({ message: "success" }, { status: 200 });
  }

  // Error: try to extract validation message from HTML
  const html = await backendResponse.text();
  const errorMatch = html.match(/class="help-block">([^<]+)</) ||
    html.match(/class="flashes"[^>]*>.*?<li[^>]*>([^<]+)<\/li>/s);
  const errorMessage = errorMatch
    ? errorMatch[1].trim()
    : "Erro ao redefinir a palavra-passe. O link pode ter expirado.";

  return NextResponse.json({ message: errorMessage }, { status: 400 });
}
