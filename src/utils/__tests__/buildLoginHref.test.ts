import { describe, expect, it } from "vitest";

import { buildLoginHref } from "../buildLoginHref";

describe("buildLoginHref", () => {
  it("keeps the locale the visitor was browsing in", () => {
    // A bare `/login` is not a route with `prefixDefault: true` — it costs an
    // i18nRouter redirect and shows the wrong URL on the way.
    expect(buildLoginHref("/en/admin/me/datasets")).toBe(
      "/en/login?next=%2Fen%2Fadmin%2Fme%2Fdatasets"
    );
    expect(buildLoginHref("/pt/admin/me/datasets")).toBe(
      "/pt/login?next=%2Fpt%2Fadmin%2Fme%2Fdatasets"
    );
  });

  it("falls back to the default locale for an unprefixed path", () => {
    expect(buildLoginHref("/admin/me/datasets")).toBe("/pt/login?next=%2Fadmin%2Fme%2Fdatasets");
  });

  it("does not send the login form back to itself", () => {
    expect(buildLoginHref("/pt/login")).toBe("/pt/login");
    expect(buildLoginHref("/en/login")).toBe("/en/login");
  });

  it("has somewhere to send a visitor with no pathname at all", () => {
    expect(buildLoginHref(null)).toBe("/pt/login");
    expect(buildLoginHref(undefined)).toBe("/pt/login");
    expect(buildLoginHref("")).toBe("/pt/login");
  });

  it("encodes a query string in the path it returns to", () => {
    expect(buildLoginHref("/pt/datasets?page=2")).toBe(
      "/pt/login?next=%2Fpt%2Fdatasets%3Fpage%3D2"
    );
  });
});
