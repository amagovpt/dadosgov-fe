import { splitLocale } from "./stripLocale";

/**
 * The login URL for someone who was trying to reach `pathname`.
 *
 * Two rules that every call site got to decide for itself before this existed,
 * and disagreed on:
 *
 * The locale prefix is kept. With `prefixDefault: true` every route carries one,
 * so a bare `/login` is not a route — `i18nRouter` answers it with a redirect to
 * `/pt/login`, which costs a round trip and shows the visitor a flash of the
 * wrong URL on the way. Re-attaching the locale they were already browsing in
 * lands them in one hop.
 *
 * `?next=` carries them back to the page they were opening, which is the whole
 * point of sending them here — except when that page is the login form itself,
 * where it would only send them in a circle. The login side validates the value
 * again (`sanitizeNextUrl`), so an absolute URL can never come back out of it.
 */
export function buildLoginHref(pathname: string | null | undefined): string {
  const { locale, path } = splitLocale(pathname);
  const next =
    pathname && !path.startsWith("/login") ? `?next=${encodeURIComponent(pathname)}` : "";

  return `/${locale}/login${next}`;
}
