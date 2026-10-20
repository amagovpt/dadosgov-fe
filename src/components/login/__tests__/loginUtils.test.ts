/**
 * LEDG-2432: `?next=` reaches window.location.href on the email sign-in path,
 * so a value that escapes sanitizeNextUrl is an open redirect off a .gov.pt
 * login page — the victim authenticates successfully on the real portal and
 * lands on the attacker's copy of it, primed to ask for the password again.
 *
 * The four payloads below all defeated the previous prefix test (starts with
 * "/", does not start with "//") and resolved to https://evil.com/. They are
 * here as the regression, not as illustration.
 */

import { describe, expect, it } from "vitest";

import { buildSamlEndpoint, sanitizeNextUrl } from "../loginUtils";

/** Where the browser would actually go, which is the only question that counts. */
const resolve = (value: string) => new URL(value, "https://dados.gov.pt/login").href;

describe("sanitizeNextUrl", () => {
  it.each([
    ["a backslash read as an authority separator", "/\\evil.com"],
    ["a backslash pair", "/\\/evil.com"],
    ["a tab the parser strips before parsing", "/\t//evil.com"],
    ["a newline the parser strips before parsing", "/\n//evil.com"],
    ["a carriage return", "/\r//evil.com"],
    ["a mixed backslash and slash", "/\\\\evil.com"],
    ["the protocol-relative form", "//evil.com"],
    ["an absolute URL", "https://evil.com/"],
    ["a scheme-only value", "javascript:alert(1)"],
    ["a leading space before an authority", " //evil.com"],
  ])("refuses %s", (_label, payload) => {
    const safe = sanitizeNextUrl(payload);

    // Two assertions on purpose: the first says what we keep, the second says
    // where it lands. A value could look path-shaped and still resolve away.
    expect(safe.startsWith("/")).toBe(true);
    expect(new URL(resolve(safe)).origin).toBe("https://dados.gov.pt");
  });

  it.each([
    ["/", "/"],
    ["/datasets", "/datasets"],
    ["/pt/datasets?page=2", "/pt/datasets?page=2"],
    ["/pt/datasets#resources", "/pt/datasets#resources"],
    ["/admin/org/profile", "/admin/org/profile"],
  ])("keeps the same-origin path %s", (input, expected) => {
    expect(sanitizeNextUrl(input)).toBe(expected);
  });

  it("falls back to the site root for nothing at all", () => {
    expect(sanitizeNextUrl(null)).toBe("/");
    expect(sanitizeNextUrl("")).toBe("/");
  });

  it("still hands buildSamlEndpoint something it can encode", () => {
    // The SAML path was the only consumer before this ticket; it must keep
    // working, and it must not receive a rejected value as if it were a page.
    expect(buildSamlEndpoint("/saml/login", sanitizeNextUrl("/datasets"))).toBe(
      "/saml/login?next=%2Fdatasets"
    );
    expect(buildSamlEndpoint("/saml/login", sanitizeNextUrl("/\\evil.com"))).toBe("/saml/login");
  });
});

describe("buildSamlEndpoint", () => {
  // The login screen asks whether the citizen is national or foreign, and used
  // to throw the answer away. These pin that it now travels, and — more
  // importantly — that it is optional: the two assertions above call this
  // function with two arguments and must keep passing untouched.
  it("carries the declared citizen type when the screen collected one", () => {
    expect(buildSamlEndpoint("/saml/login", "/", "foreign")).toBe("/saml/login?citizen=foreign");
  });

  it("omits it entirely when nothing was declared", () => {
    // eIDAS never asks, and the account-linking notice on the email tab starts
    // a CMD login without the question. Both must send no parameter at all
    // rather than an empty one — the backend records nothing for a value it
    // does not recognise, and an empty string is not the same as absent.
    expect(buildSamlEndpoint("/saml/eidas/login", "/")).toBe("/saml/eidas/login");
    expect(buildSamlEndpoint("/saml/login", "/", undefined)).toBe("/saml/login");
    expect(buildSamlEndpoint("/saml/login", "/", "")).toBe("/saml/login");
  });

  it("carries both parameters, each encoded, when both are present", () => {
    expect(buildSamlEndpoint("/saml/login", "/pt/datasets?page=2", "national")).toBe(
      "/saml/login?next=%2Fpt%2Fdatasets%3Fpage%3D2&citizen=national"
    );
  });

  it("keeps the next-URL encoding it had before the third parameter existed", () => {
    // Regression guard for the switch to URLSearchParams: the encoding of
    // `next` must not have drifted, because the value reaches
    // window.location.href on the way back.
    expect(buildSamlEndpoint("/saml/login", "/datasets")).toBe("/saml/login?next=%2Fdatasets");
    expect(buildSamlEndpoint("/saml/login", "/pt/datasets#resources")).toBe(
      "/saml/login?next=%2Fpt%2Fdatasets%23resources"
    );
  });
});
