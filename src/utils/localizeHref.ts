import { i18nConfig } from "@/config/i18nConfig";

/**
 * Paths served outside the `[locale]` tree — Next route handlers, Flask-proxied
 * backend routes and static assets. They must never gain a locale prefix.
 * Mirrors the matcher exclusions in `src/proxy.ts`.
 */
const NON_LOCALIZED_PREFIXES = [
  "/api",
  "/auth",
  "/internal-api",
  "/confirm",
  "/reset",
  "/confirm-change-email",
  "/assets",
  "/swaggerui",
  "/s",
  "/saml",
  "/get-csrf",
  "/logout",
  "/_next",
];

/**
 * Prefixes an internal href with the active locale (`/datasets` → `/pt/datasets`).
 *
 * With `prefixDefault: true` every page URL must carry a locale. An unprefixed
 * `<Link>` href forces a 307 from the i18n proxy on every router prefetch; the
 * redirected response is `Cache-Control: no-store`, so the Next router can never
 * cache it and re-issues the prefetch indefinitely — the request loop observed
 * on the homepage. Building the final URL client-side avoids the redirect
 * (and the loop) entirely.
 *
 * No-ops on: external/protocol-relative URLs, bare anchors (`#…`), already
 * localized paths, non-localized route prefixes and file paths (`/favicon.png`).
 */
export function localizeHref(href: string, locale: string): string {
  if (!href || !href.startsWith("/") || href.startsWith("//")) return href;

  const pathname = href.split(/[?#]/)[0];
  const firstSegment = pathname.split("/")[1] ?? "";
  const locales = i18nConfig.locales as readonly string[];

  if (locales.includes(firstSegment)) return href;
  if (NON_LOCALIZED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return href;
  }
  // Static files (`/favicon.png`, `/Logos/x.svg`) are excluded from the i18n
  // proxy matcher and must keep their real path.
  if (/\.[^/]+$/.test(pathname)) return href;

  const resolvedLocale = locales.includes(locale) ? locale : i18nConfig.defaultLocale;
  const suffix = href.slice(pathname.length);
  return `/${resolvedLocale}${pathname === "/" ? "" : pathname}${suffix}`;
}
