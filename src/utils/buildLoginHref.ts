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
 * again (`sanitizeNextUrl`), which is what stops an absolute URL coming back
 * out of it. That claim used to be made here about a prefix test that did not
 * hold it up: four spellings got past it (LEDG-2432), so the check now parses
 * the value and compares origins. Do not weaken it back into a string test —
 * this value reaches `window.location.href`.
 */
export function buildLoginHref(pathname: string | null | undefined): string {
  const { locale, path } = splitLocale(pathname);
  const next =
    pathname && !path.startsWith("/login") ? `?next=${encodeURIComponent(pathname)}` : "";

  return `/${locale}/login${next}`;
}
