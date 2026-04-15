import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "../backend-fetch";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const contentType = request.headers.get("content-type") || "application/x-www-form-urlencoded";

  let backendResponse: Response;
  try {
    backendResponse = await backendFetch("/login/", {
      method: "POST",
      headers: {
        "Content-Type": contentType,
        Cookie: request.headers.get("cookie") || "",
      },
      body,
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

    // Build a cookie string with the session cookies from the login response
    // so the migration check call uses the authenticated session
    const existingCookies = request.headers.get("cookie") || "";
    const newCookies = setCookies.map((c) => c.split(";")[0]).join("; ");
    const allCookies = [existingCookies, newCookies].filter(Boolean).join("; ");

    // Check if this is a legacy user that needs CMD migration
    try {
      const checkResponse = await backendFetch("/saml/migration/check", {
        headers: { Cookie: allCookies },
      });

      if (checkResponse.ok) {
        const checkData = await checkResponse.json();

        if (checkData.needs_migration) {
          // Log the user out — they must migrate via CMD first
          await backendFetch("/logout/", {
            headers: { Cookie: allCookies },
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
