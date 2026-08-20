import { NextRequest, NextResponse } from "next/server";
import { i18nRouter } from "next-i18n-router";
import { i18nConfig } from "./config/i18nConfig";
import { getRouteRestrictions } from "./service/commom/routeRestrictions";
import { isPathRestricted } from "./utils/matchRestrictedPath";

/**
 * Next.js proxy (formerly middleware) for dados.gov.pt.
 *
 * Responsibilities:
 *   1) Generate a per-request CSP nonce and inject it into the response
 *      Content-Security-Policy header so `'unsafe-inline'` can be removed
 *      from `script-src` (TICKET-56b / VULN-2075 layer 3).
 *   2) Expose the nonce to React Server Components via the `x-nonce`
 *      request header so Next.js automatically applies it to hydration
 *      scripts (https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy).
 *   3) Inject `X-Forwarded-Host` on backend-proxied routes so Flask
 *      (ProxyFix, SERVER_NAME) sees the expected host when the frontend
 *      runs in Docker.
 *
 * The CSP is intentionally built here (not in `next.config.ts`) because
 * the nonce must be regenerated per request — static headers in
 * `next.config.ts` cannot carry runtime values.
 */

const BACKEND_HOST = process.env.BACKEND_HOST || "";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

const BACKEND_PROXY_PATHS = ["/api/", "/saml/", "/logout/", "/get-csrf", "/s/", "/swaggerui/"];

// Paths that must NOT receive a Next.js CSP. `/saml/*` is served by Flask
// (auto-submit forms with their own CSP); double-CSP would break the SAML
// dance. Backend-proxied paths return raw upstream responses and should
// inherit the upstream CSP (or none).
const NO_CSP_PATHS = ["/saml/", "/api/", "/s/", "/swaggerui/", "/confirm", "/reset", "/get-csrf"];

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function buildCsp(nonce: string): string {
  // style-src 'unsafe-inline' is intentionally retained — Tailwind 4 and
  // the Agora design system inject inline <style> in runtime. Removing it
  // requires a separate effort (tracked as TICKET-56c follow-up); style
  // injection is a far weaker attack surface than script injection.
  //
  // 'unsafe-eval' is only added in development: React uses eval() for
  // callstack reconstruction and other dev-mode debugging features, but
  // never in production builds.
  const scriptSrcExtras = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' https://cdnjs.cloudflare.com https://www.google.com https://www.gstatic.com${scriptSrcExtras}`,
    `style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://www.gstatic.com`,
    `img-src 'self' data: blob: http://localhost:7000 ${API_URL} https://dados.gov.pt https://preprod.dados.gov.pt https://10.55.37.38 https://172.31.204.12 https://ppr-dadosgov.arte.gov.pt https://prd-dadosgov.arte.gov.pt https://raw.githubusercontent.com https://www.gstatic.com`,
    `frame-src 'self' https://app.powerbi.com https://www.google.com`,
    `font-src 'self' data:`,
    `connect-src 'self' http://localhost:7000 https://dados.gov.pt https://preprod.dados.gov.pt https://10.55.37.38 https://172.31.204.12 https://ppr-dadosgov.arte.gov.pt https://prd-dadosgov.arte.gov.pt`,
    `frame-ancestors 'none'`,
  ].join("; ");
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isBackendProxy = BACKEND_PROXY_PATHS.some((p) => pathname.startsWith(p));

  // Route gatekeeper: only localized page requests (path already carries a
  // valid locale prefix) are eligible. Requests missing a locale are left to
  // i18nRouter to redirect; they come back through here with the locale.
  const localeSegment = pathname.split("/")[1];
  const hasLocale = i18nConfig.locales.includes(localeSegment);

  const skipCsp = NO_CSP_PATHS.some((p) => pathname.startsWith(p));

  const requestHeaders = new Headers(request.headers);

  if (isBackendProxy && BACKEND_HOST) {
    requestHeaders.set("X-Forwarded-Host", BACKEND_HOST);
  }

  let nonce: string | undefined;

  if (!skipCsp) {
    nonce = generateNonce();
    requestHeaders.set("x-nonce", nonce);
  }

  // Gatekeeper: 404 requests to routes disabled in the Header / Admin nav CMS.
  // Fails open — any error here lets the request proceed rather than 404ing.
  if (!isBackendProxy && hasLocale) {
    try {
      const disabledPaths = await getRouteRestrictions(localeSegment);
      if (isPathRestricted(pathname, disabledPaths)) {
        // Rewrite inside the locale so the `[...not-found]` catch-all picks it
        // up and renders `[locale]/not-found.tsx` with the site chrome. The
        // bare `/_not-found` is Next's internal route, which sits outside the
        // `[locale]` layout and renders the unstyled builtin 404.
        const notFoundUrl = new URL(`/${localeSegment}/_not-found`, request.url);
        const notFound = NextResponse.rewrite(notFoundUrl, {
          request: { headers: requestHeaders },
          status: 404,
        });
        if (nonce) {
          notFound.headers.set("Content-Security-Policy", buildCsp(nonce));
        }
        return notFound;
      }
    } catch (error) {
      console.error("Route gatekeeper error; allowing request:", error);
    }
  }

  const response = i18nRouter(request, i18nConfig);

  if (nonce) {
    response.headers.set("Content-Security-Policy", buildCsp(nonce));
  }

  const rewriteUrl = response.headers.get("x-middleware-rewrite");
  if (rewriteUrl) {
    return NextResponse.rewrite(new URL(rewriteUrl, request.url), {
      request: {
        headers: requestHeaders,
      },
      headers: response.headers,
    });
  }

  return response;
}

export const config = {
  matcher: [
    {
      source:
        "/((?!api/|auth/|internal-api/|confirm/|reset/|confirm-change-email/|assets/|swaggerui/|s/|saml/|get-csrf|_next/static|.*\\..*|_next/image|favicon.ico|favicon.png|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|eot)$).*)",
    },
  ],
};
