import { i18nConfig } from "@/config/i18nConfig";

/**
 * Removes a leading locale segment (e.g. `/pt`, `/en`) from a pathname.
 *
 * With `prefixDefault: true` in the i18n config, every route is prefixed with
 * the active locale (`/pt/admin/org/{id}`), so `usePathname()` returns a
 * locale-prefixed path. Matchers anchored on `/admin` (regexes, `startsWith`)
 * would silently fail. Use this to normalize the pathname back to a
 * locale-agnostic form (`/admin/org/{id}`) before matching.
 */
export function stripLocale(pathname: string | null | undefined): string {
  return splitLocale(pathname).path;
}

/**
 * Same normalization as `stripLocale`, but also returns which locale was
 * stripped — falling back to the default when the path carries none.
 *
 * Server-side code needs both halves: it has no `usePathname()`, so when it
 * builds a redirect target it must re-attach the locale the visitor was
 * actually browsing in.
 */
export function splitLocale(pathname: string | null | undefined): {
  locale: string;
  path: string;
} {
  if (!pathname) return { locale: i18nConfig.defaultLocale, path: "/" };
  const match = pathname.match(/^\/([^/]+)(\/.*|$)/);
  if (match && (i18nConfig.locales as readonly string[]).includes(match[1])) {
    return { locale: match[1], path: match[2] || "/" };
  }
  return { locale: i18nConfig.defaultLocale, path: pathname };
}
