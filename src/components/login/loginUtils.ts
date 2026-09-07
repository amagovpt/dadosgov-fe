import type { TFunction } from "i18next";

/**
 * Reduce a `?next=` value to a path on this origin, or to "/".
 *
 * The prefix test this replaced — starts with "/" and not with "//" — let an
 * absolute URL through, and the value now reaches `window.location.href` on the
 * email sign-in path, so a bypass is an open redirect off a .gov.pt login page:
 * the victim authenticates successfully on the real portal and lands on the
 * attacker's copy of it.
 *
 * Four shapes defeated the prefix test, because the URL parser does not read
 * the string the way `startsWith` does. It treats a backslash as an authority
 * separator, and it strips tab, LF and CR before parsing at all:
 *
 *   /\evil.com      /\/evil.com      /<tab>//evil.com      /<lf>//evil.com
 *
 * all resolved to https://evil.com/. So this parses the value the same way the
 * browser will and keeps it only when the result is same-origin — the check is
 * then about what the URL *means*, not about how it is spelled, and a fifth
 * spelling cannot be found. The C0 control strip happens first regardless, so a
 * value that only becomes same-origin after the parser discards characters
 * cannot smuggle an authority past us.
 */
export function sanitizeNextUrl(raw: string | null): string {
  if (!raw) return "/";

  // Exactly what the URL parser discards: it strips every ASCII tab and
  // newline from anywhere in the input, then trims leading/trailing C0
  // controls and spaces. Doing it here means the string we validate is the
  // string the parser will act on — /<tab>//evil.com only looks relative
  // before this runs.
  const value = raw
    .replace(/[\u0009\u000A\u000D]/g, "")
    .replace(/^[\u0000-\u0020]+|[\u0000-\u0020]+$/g, "");
  if (!value.startsWith("/")) return "/";

  // Relative to an opaque base: any value carrying its own authority — with a
  // scheme, with "//", or with the backslashes the parser treats the same way —
  // resolves to a different origin and is rejected by the comparison.
  const base = "https://sanitize.invalid";
  try {
    const url = new URL(value, base);
    if (url.origin !== base) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

export function buildSamlEndpoint(base: string, nextUrl: string): string {
  return nextUrl !== "/" ? `${base}?next=${encodeURIComponent(nextUrl)}` : base;
}

export async function submitSamlForm(endpoint: string, t: TFunction): Promise<string | null> {
  try {
    const res = await fetch(endpoint);
    if (!res.ok) {
      const text = await res.text();
      console.error("SAML login failed:", res.status, text);
      return t("errors.samlStart", { status: res.status });
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      console.error("SAML login: unexpected response type:", contentType, text.substring(0, 500));
      return t("errors.samlBadResponse");
    }

    const data = await res.json();
    if (!data.action || !data.SAMLRequest) {
      console.error("SAML login: missing fields in response:", data);
      return t("errors.samlIncomplete");
    }

    const form = document.createElement("form");
    form.method = "POST";
    form.action = data.action;

    const samlInput = document.createElement("input");
    samlInput.type = "hidden";
    samlInput.name = "SAMLRequest";
    samlInput.value = data.SAMLRequest;
    form.appendChild(samlInput);

    const relayInput = document.createElement("input");
    relayInput.type = "hidden";
    relayInput.name = "RelayState";
    relayInput.value = data.RelayState;
    form.appendChild(relayInput);

    document.body.appendChild(form);
    form.submit();
    return null;
  } catch (e) {
    console.error("SAML login error:", e);
    return t("errors.samlConnection");
  }
}
