import { describe, expect, it } from "vitest";
import { localizeHref } from "../localizeHref";

describe("localizeHref", () => {
  it("prefixes internal paths with the active locale", () => {
    expect(localizeHref("/datasets", "pt")).toBe("/pt/datasets");
    expect(localizeHref("/datasets/slug-1", "en")).toBe("/en/datasets/slug-1");
    expect(localizeHref("/", "pt")).toBe("/pt");
  });

  it("keeps query string and hash intact", () => {
    expect(localizeHref("/login?next=%2Fpt%2Fdatasets", "pt")).toBe(
      "/pt/login?next=%2Fpt%2Fdatasets"
    );
    expect(localizeHref("/docs#api", "en")).toBe("/en/docs#api");
  });

  it("does not double-prefix already localized paths", () => {
    expect(localizeHref("/pt/datasets", "pt")).toBe("/pt/datasets");
    expect(localizeHref("/en/datasets", "pt")).toBe("/en/datasets");
    expect(localizeHref("/pt", "pt")).toBe("/pt");
  });

  it("falls back to the default locale for unknown locales", () => {
    expect(localizeHref("/datasets", "fr")).toBe("/pt/datasets");
    expect(localizeHref("/datasets", "")).toBe("/pt/datasets");
  });

  it("leaves external URLs and bare anchors untouched", () => {
    expect(localizeHref("https://example.com/x", "pt")).toBe("https://example.com/x");
    expect(localizeHref("//example.com/x", "pt")).toBe("//example.com/x");
    expect(localizeHref("mailto:x@y.pt", "pt")).toBe("mailto:x@y.pt");
    expect(localizeHref("#", "pt")).toBe("#");
    expect(localizeHref("", "pt")).toBe("");
  });

  it("leaves non-localized route prefixes untouched", () => {
    expect(localizeHref("/saml/logout", "pt")).toBe("/saml/logout");
    expect(localizeHref("/api/1/datasets/", "pt")).toBe("/api/1/datasets/");
    expect(localizeHref("/auth/me", "pt")).toBe("/auth/me");
    expect(localizeHref("/s/avatars/x-original.jpg", "pt")).toBe("/s/avatars/x-original.jpg");
  });

  it("does not confuse pages with non-localized prefixes sharing initials", () => {
    // `/search` must not match the `/s` backend proxy prefix.
    expect(localizeHref("/search", "pt")).toBe("/pt/search");
  });

  it("leaves static file paths untouched", () => {
    expect(localizeHref("/favicon.png", "pt")).toBe("/favicon.png");
    expect(localizeHref("/Logos/github.svg", "pt")).toBe("/Logos/github.svg");
  });
});
