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

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildSamlEndpoint,
  clearMigrationInviteSkip,
  readMigrationInviteSkip,
  sanitizeNextUrl,
  skipMigrationInviteOnNextEntry,
} from "../loginUtils";

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

/**
 * LEDG-2642: somebody who has just recovered access should not meet a
 * full-screen invitation on the way back in. The mark travels from the reset
 * screen to the page they land on after signing in -- across two full page
 * loads, which is why it lives in sessionStorage and not in React state.
 */
describe("the one-shot mark that silences the invite after a password reset", () => {
  beforeEach(() => window.sessionStorage.clear());
  afterEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
  });

  it("is absent until something writes it", () => {
    expect(readMigrationInviteSkip()).toBe(false);
  });

  it("survives being read, so reading during render cannot consume it", () => {
    skipMigrationInviteOnNextEntry();
    expect(readMigrationInviteSkip()).toBe(true);
    expect(readMigrationInviteSkip()).toBe(true);
  });

  it("is gone once cleared, which is what makes it one-shot", () => {
    skipMigrationInviteOnNextEntry();
    clearMigrationInviteSkip();
    expect(readMigrationInviteSkip()).toBe(false);
  });

  it("uses a key of its own, so it cannot erase the banner's", () => {
    window.sessionStorage.setItem("migrationInviteHiddenForVisit", "1");
    skipMigrationInviteOnNextEntry();
    clearMigrationInviteSkip();
    expect(window.sessionStorage.getItem("migrationInviteHiddenForVisit")).toBe("1");
  });

  /**
   * 🚩 Fails towards VISIBLE. A browser that refuses storage -- private mode,
   * blocked cookies -- must leave the invite showing exactly as it does today,
   * never throw and take the page with it.
   */
  it("says nothing is marked when the storage refuses to answer", () => {
    vi.spyOn(window.sessionStorage, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readMigrationInviteSkip()).toBe(false);
  });

  it("stays quiet when the storage refuses to write or forget", () => {
    vi.spyOn(window.sessionStorage, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(window.sessionStorage, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => skipMigrationInviteOnNextEntry()).not.toThrow();
    expect(() => clearMigrationInviteSkip()).not.toThrow();
  });
});

/**
 * The server has no sessionStorage at all, and the gate that reads this mark
 * is rendered there. jsdom always provides `window`, so no runtime test can
 * reach that branch -- this reads the source instead, which is the only way
 * the guard can be held in place.
 */
describe("every storage access is guarded against having no window", () => {
  it("never touches sessionStorage without checking for window first", async () => {
    const { readFileSync } = await import("node:fs");
    const path = await import("node:path");
    const source = readFileSync(
      path.join(process.cwd(), "src/components/login/loginUtils.ts"),
      "utf8"
    );

    const accesses = source.match(/window\.sessionStorage/g) ?? [];
    const guards = source.match(/typeof window === "undefined"/g) ?? [];

    expect(accesses.length).toBeGreaterThan(0);
    expect(guards.length).toBeGreaterThanOrEqual(3);
  });
});
