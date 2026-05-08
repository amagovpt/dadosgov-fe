import type { NextConfig } from "next";
import { readFileSync } from "fs";
import { resolve } from "path";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:7000";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

const urlAPI = new URL(API_URL);

// Read udata version from backend pyproject.toml at build time
let udataVersion = "unknown";
try {
  const pyproject = readFileSync(resolve(__dirname, "../backend/pyproject.toml"), "utf-8");
  const match = pyproject.match(/^version\s*=\s*"([^"]+)"/m);
  if (match) udataVersion = match[1];
} catch {
  // backend dir not available (e.g. standalone frontend deploy)
}


const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_UDATA_VERSION: udataVersion,
  },
  // Allow `next dev` to run a 2nd instance side-by-side (the disposable
  // test stack on port 3001) without colliding on the default `.next` lock.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // Standalone output for Docker deployment
  output: "standalone",
  // Prevent Next.js from stripping trailing slashes on proxied routes,
  // which causes redirect loops with Flask (Flask adds trailing slash,
  // Next.js removes it → 308 loop).
  skipTrailingSlashRedirect: true,
  compress: true,
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  async headers() {
    const securityHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      {
        key: "Permissions-Policy",
        value:
          'camera=(), microphone=(), geolocation=(), interest-cohort=() fullscreen=(self "https://app.powerbi.com")',
      },
    ];

    return [
      {
        // SAML routes return auto-submit forms from the backend with their
        // own CSP — do not add a second, stricter CSP from Next.js.
        source: "/saml/:path*",
        headers: securityHeaders,
      },
      {
        source: "/(.*)",
        headers: [
          ...securityHeaders,
          {
            key: "Content-Security-Policy",
            value:
              `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; img-src 'self' data: blob: http://localhost:7000 ${API_URL} https://dados.gov.pt https://preprod.dados.gov.pt https://10.55.37.38 https://172.31.204.12 https://ppr-dadosgov.arte.gov.pt https://prd-dadosgov.arte.gov.pt https://raw.githubusercontent.com; frame-src 'self' https://app.powerbi.com; font-src 'self' data:; connect-src 'self' http://localhost:7000 https://dados.gov.pt https://preprod.dados.gov.pt https://10.55.37.38 https://172.31.204.12 https://ppr-dadosgov.arte.gov.pt https://prd-dadosgov.arte.gov.pt; frame-ancestors 'none';`,
          },
        ],
      },
    ];
  },
  images: {
    deviceSizes: [320, 576, 768, 992, 1248],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost:7000",
      },
      {
        protocol: "http",
        hostname: "localhost:7000/static",
      },
      {
        protocol: urlAPI.protocol.slice(0, -1) as "http" | "https", // remove trailing colon
        hostname: urlAPI.hostname || "",
      }
    ],
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/get-csrf",
          destination: `${BACKEND_URL}/get-csrf`,
        },
        // SAML / Autenticação.gov routes
        {
          source: "/saml/login",
          destination: `${BACKEND_URL}/saml/login`,
        },
        {
          source: "/saml/sso",
          destination: `${BACKEND_URL}/saml/sso`,
        },
        {
          source: "/saml/logout",
          destination: `${BACKEND_URL}/saml/logout`,
        },
        {
          source: "/saml/sso_logout",
          destination: `${BACKEND_URL}/saml/sso_logout`,
        },
        // Account migration routes
        {
          source: "/saml/migration/:path*",
          destination: `${BACKEND_URL}/saml/migration/:path*`,
        },
        // eIDAS routes
        {
          source: "/saml/eidas/login",
          destination: `${BACKEND_URL}/saml/eidas/login`,
        },
        {
          source: "/saml/eidas/sso",
          destination: `${BACKEND_URL}/saml/eidas/sso`,
        },
        {
          source: "/saml/eidas/logout",
          destination: `${BACKEND_URL}/saml/eidas/logout`,
        },
        {
          source: "/saml/eidas/sso_logout",
          destination: `${BACKEND_URL}/saml/eidas/sso_logout`,
        },
        // Static file storage served by flask_storage at /s/<bucket>/<path>
        {
          source: "/s/:path*",
          destination: `${BACKEND_URL}/s/:path*`,
        },
        // SECURITY (TICKET-60 / VULN-2079): every `/api/*` route in Next.js
        // is shadowed by the rewrite to the Flask backend below. Do NOT add
        // Next.js handlers under `/api/` — they would be unreachable here,
        // but if this rewrite ever changes they would suddenly be exposed
        // (and likely diverged from the backend equivalent). The CSV proxy
        // lives at `/internal-api/proxy-csv` for that reason.
        //
        // Must be in beforeFiles to avoid redirect loops when Flask returns
        // 308 trailing-slash redirects.
        {
          source: "/api/:path*",
          destination: `${BACKEND_URL}/api/:path*`,
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  // TODO: Install @sentry/nextjs and configure
  // TODO: Implement sitemap via app/sitemap.ts or next-sitemap
};

export default nextConfig;
