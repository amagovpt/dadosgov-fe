import type { NextConfig } from "next";
import { readFileSync } from "fs";
import { relative, resolve, sep } from "path";
import { resolveAgoraActionIcons } from "./config/agora-action-icons";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

const urlAPI = new URL(API_URL);
const agoraActionIcons = resolveAgoraActionIcons(__dirname);

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
  turbopack: {
    resolveAlias: Object.fromEntries(Object.entries(agoraActionIcons).map(([name, file]) => [
      name, `./${relative(__dirname, file).split(sep).join("/")}`,
    ])),
  },
  webpack(config) {
    config.resolve.alias = { ...config.resolve.alias, ...agoraActionIcons };
    return config;
  },
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
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  compress: true,
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  // No `experimental.proxyClientMaxBodySize` override: resource uploads are
  // chunked client-side (chunkedUploadFetch, parts of
  // uiConfig.resourceFileUploadChunk = 2MB), so no request streamed through the
  // `/api/*` forward in `src/proxy.ts` exceeds the chunk size — well under
  // Next's 10MB default. In production nginx routes `/api/` straight to the
  // backend, so the Next proxy is not even in the upload path there.
  // CAVEAT: if uiConfig.resourceFileUploadChunk is ever raised above Next's
  // 10MB proxy default, re-add `experimental.proxyClientMaxBodySize` here
  // (>= the chunk size) AND raise the fronting nginx `client_max_body_size` to
  // match wherever the Next proxy is in the path (e.g. local dev).
  async headers() {
    // Content-Security-Policy is emitted per-request from `src/proxy.ts`
    // (TICKET-56b) so it can carry a fresh nonce on each response. The
    // remaining static security headers stay here.
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
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    deviceSizes: [320, 576, 768, 992, 1248],
    // Keep optimized image variants on disk for 30 days before re-optimizing.
    // The optimizer writes each variant to `.next/cache/images` and only
    // refreshes an entry when it is requested again after the TTL expires; a
    // short TTL means the same images are re-generated (and re-written)
    // constantly, bloating the cache dir. A long TTL curbs that churn.
    minimumCacheTTL: 2592000,
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
        protocol: "https",
        hostname: "raw.githubusercontent.com",
      },
      {
        protocol: urlAPI.protocol.slice(0, -1) as "http" | "https", // remove trailing colon
        hostname: urlAPI.hostname || "",
      },
    ],
  },
  // Legacy URL scheme: public routes used to live under `/pages/*`
  // (old `src/app/pages/...` structure, before the `[locale]/(pages)` route
  // group). Links in already-sent emails, bookmarks and search-engine indexes
  // still carry the prefix, so strip it permanently. Renamed routes get an
  // explicit mapping before the catch-all; the locale-prefixed variants cover
  // links that were minted after i18n routing but before the prefix removal.
  async redirects() {
    const legacyRenames = [
      { legacy: "posts/:slug", current: "noticias/:slug" },
      { legacy: "support", current: "ajuda-e-contactos" },
      { legacy: "resources/publications", current: "recursos/publicacoes" },
    ];
    return [
      ...legacyRenames.flatMap(({ legacy, current }) => [
        { source: `/pages/${legacy}`, destination: `/${current}`, permanent: true },
        {
          source: `/:locale(pt|en)/pages/${legacy}`,
          destination: `/:locale/${current}`,
          permanent: true,
        },
      ]),
      { source: "/pages/:path*", destination: "/:path*", permanent: true },
      {
        source: "/:locale(pt|en)/pages/:path*",
        destination: "/:locale/:path*",
        permanent: true,
      },
    ];
  },
  // No `rewrites()`: the Flask routes served on this host (`/api`, `/saml`,
  // `/s`, email links, …) are forwarded by `src/proxy.ts`, which reads
  // `BACKEND_URL` per request. This file is evaluated at `next build`, so a
  // rewrite destination here would freeze the backend into the image.
  // TODO: Install @sentry/nextjs and configure
  // TODO: Implement sitemap via app/sitemap.ts or next-sitemap
};

export default nextConfig;
