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
 *   3) Forward the Flask routes served on this host to `BACKEND_URL`.
 *
 * The CSP is intentionally built here (not in `next.config.ts`) because
 * the nonce must be regenerated per request — static headers in
 * `next.config.ts` cannot carry runtime values.
 *
 * The backend forwarding lives here for the same reason. `next.config.ts` is
 * evaluated at `next build` and serialized into the standalone `server.js`,
 * so a `rewrites()` destination built from `BACKEND_URL` froze the backend
 * of whichever environment the image was built for. Read per request, one
 * image can be promoted through dev/tst/ppr/prd. An absolute
 * `NextResponse.rewrite` goes through the same internal HTTP proxy as a
 * config rewrite (cookies, redirects, streaming, `Range`, x-forwarded-host).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

// Flask routes served on this host, forwarded to the backend unchanged.
//
// 🚩 The SAML list is exhaustive and has no catch-all: a backend route not
// named here is answered by Next.js with a 404 rather than reaching Flask.
// That is how /saml/link/start and /saml/eidas/link/start (starting a CMD/eIDAS
// link from an account that is ALREADY signed in, LEDG-2517) once shipped
// dead: the components were built and tested, and every test mocked the fetch.
// /saml/login and /saml/eidas/login are anonymous-only on the backend.
const BACKEND_EXACT_PATHS = [
  "/get-csrf",
  "/saml/login",
  "/saml/sso",
  "/saml/logout",
  "/saml/sso_logout",
  "/saml/link/start",
  "/saml/eidas/link/start",
  "/saml/eidas/login",
  "/saml/eidas/sso",
  "/saml/eidas/logout",
  "/saml/eidas/sso_logout",
];

const BACKEND_PREFIXES = [
  // Account migration routes.
  "/saml/migration",
  // Flask-Security endpoints whose URLs are sent in emails
  // (https://<host>/confirm/<token>). Each ends in a 302 to the homepage with
  // a flash message, so no Next.js page is needed.
  "/confirm",
  "/reset",
  "/confirm-change-email",
  // Static file storage served by flask_storage at /s/<bucket>/<path>.
  "/s",
  // SECURITY (TICKET-60 / VULN-2079): every `/api/*` route in Next.js is
  // shadowed by this forward to the Flask backend. Do NOT add Next.js
  // handlers under `/api/` — they would be unreachable here, but if this ever
  // changes they would suddenly be exposed (and likely diverged from the
  // backend equivalent). The CSV proxy lives at `/internal-api/proxy-csv`.
  "/api",
  // Swagger UI static assets served by Flask-RestX at the backend root, so
  // `/api/1/` rendered via the frontend can load its CSS/JS.
  "/swaggerui",
];

// Prefixes excluded from page handling: anything under them that is not a
// backend route above gets Next's plain 404, never the locale redirect.
const NON_PAGE_PREFIXES = [...BACKEND_PREFIXES, "/saml", "/get-csrf"];

const hasPrefix = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

// Mirrors the `rewrites()` matching this replaced: the trailing slash is
// dropped, so `/api/1/datasets/` reaches Flask as `/api/1/datasets`.
function backendDestination(request: NextRequest): URL | null {
  const path = request.nextUrl.pathname.replace(/\/+$/, "") || "/";
  const isBackend =
    BACKEND_EXACT_PATHS.includes(path) || BACKEND_PREFIXES.some((p) => hasPrefix(path, p));
  if (!isBackend) return null;
  // Read per request (never at module scope) so the value comes from the
  // container environment, not from the build.
  const backendUrl = (process.env.BACKEND_URL || "http://127.0.0.1:7000").replace(/\/+$/, "");
  return new URL(`${backendUrl}${path}${request.nextUrl.search}`);
}

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
  // Analytics hosts: Usercentrics CMP (consent banner) and Google Analytics
  // (gtag loader + collection endpoints), loaded from the root layout <head>.
  const analyticsScriptSrc = "https://web.cmp.usercentrics.eu https://www.googletagmanager.com";
  const analyticsConnectSrc =
    "https://*.usercentrics.eu https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com";
  const analyticsImgSrc = "https://*.google-analytics.com https://www.googletagmanager.com";
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' https://cdnjs.cloudflare.com https://www.google.com https://www.gstatic.com ${analyticsScriptSrc}${scriptSrcExtras}`,
    `style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://www.gstatic.com`,
    `img-src 'self' data: blob: http://localhost:7000 ${API_URL} https://dados.gov.pt https://preprod.dados.gov.pt https://10.55.37.38 https://172.31.204.12 https://ppr-dadosgov.arte.gov.pt https://prd-dadosgov.arte.gov.pt https://raw.githubusercontent.com https://www.gstatic.com ${analyticsImgSrc}`,
    `frame-src 'self' https://app.powerbi.com https://www.google.com`,
    `font-src 'self' data:`,
    `connect-src 'self' http://localhost:7000 https://dados.gov.pt https://preprod.dados.gov.pt https://10.55.37.38 https://172.31.204.12 https://ppr-dadosgov.arte.gov.pt https://prd-dadosgov.arte.gov.pt ${analyticsConnectSrc}`,
    `frame-ancestors 'none'`,
  ].join("; ");
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Backend routes skip CSP, the gatekeeper and i18n: they return the raw
  // upstream response and inherit its CSP (or none). `/saml/*` in particular
  // serves auto-submit forms with their own CSP; a second one would break the
  // SAML dance.
  const backend = backendDestination(request);
  if (backend) return NextResponse.rewrite(backend);
  if (NON_PAGE_PREFIXES.some((p) => hasPrefix(pathname.replace(/\/+$/, ""), p))) {
    return NextResponse.next();
  }

  // Route gatekeeper: only localized page requests (path already carries a
  // valid locale prefix) are eligible. Requests missing a locale are left to
  // i18nRouter to redirect; they come back through here with the locale.
  const localeSegment = pathname.split("/")[1];
  const hasLocale = i18nConfig.locales.includes(localeSegment);

  const requestHeaders = new Headers(request.headers);
  const nonce = generateNonce();
  requestHeaders.set("x-nonce", nonce);

  // Gatekeeper: 404 requests to routes disabled in the Header / Admin nav CMS.
  // Fails open — any error here lets the request proceed rather than 404ing.
  if (hasLocale) {
    try {
      const disabledPaths = await getRouteRestrictions(localeSegment);
      if (isPathRestricted(pathname, disabledPaths)) {
        // Rewrite inside the locale so the `[...not-found]` catch-all picks it
        // up and renders `(pages)/not-found.tsx` with the site chrome. The
        // bare `/_not-found` is Next's internal route, which sits outside the
        // `[locale]` layout and renders the unstyled builtin 404.
        const notFoundUrl = new URL(`/${localeSegment}/_not-found`, request.url);
        const notFound = NextResponse.rewrite(notFoundUrl, {
          request: { headers: requestHeaders },
          status: 404,
        });
        notFound.headers.set("Content-Security-Policy", buildCsp(nonce));
        return notFound;
      }
    } catch (error) {
      console.error("Route gatekeeper error; allowing request:", error);
    }
  }

  // i18nRouter builds its NextResponse.next() from the headers of the request
  // it receives, so hand it the modified headers: otherwise `x-nonce` only
  // reaches the app on the rewrite branch below and the layout sees undefined.
  const response = i18nRouter(new NextRequest(request, { headers: requestHeaders }), i18nConfig);

  response.headers.set("Content-Security-Policy", buildCsp(nonce));

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
  // Matchers must be literals (statically analyzed at build time). The backend
  // prefixes are listed on their own because the page matcher below skips any
  // path ending in a file extension (`/s/images/a.png`, `/swaggerui/x.js`).
  matcher: [
    "/get-csrf",
    "/saml/:path*",
    "/confirm/:path*",
    "/reset/:path*",
    "/confirm-change-email/:path*",
    "/s/:path*",
    "/api/:path*",
    "/swaggerui/:path*",
    {
      source:
        "/((?!api/|auth/|internal-api/|confirm/|reset/|confirm-change-email/|assets/|swaggerui/|s/|saml/|get-csrf|_next/|\\.well-known/|robots\\.txt|sitemap\\.xml|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|woff2?|ttf|otf|eot|css|js|mjs|map)$).*)",
    },
  ],
};
