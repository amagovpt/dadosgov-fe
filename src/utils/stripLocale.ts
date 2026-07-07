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
  if (!pathname) return "/";
  const match = pathname.match(/^\/([^/]+)(\/.*|$)/);
  if (match && (i18nConfig.locales as readonly string[]).includes(match[1])) {
    return match[2] || "/";
  }
  return pathname;
}
