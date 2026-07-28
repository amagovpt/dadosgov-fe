import { describe, expect, it } from "vitest";
import {
  buildBreadcrumbItems,
  prettifySegment,
  sanitizeBreadcrumbItems,
} from "../breadcrumbs";

// Fake i18next translator: resolves a few known keys, otherwise falls back to
// the caller-provided defaultValue (mirroring react-i18next's behaviour).
const dict: Record<string, string> = {
  "breadcrumbs.home": "Início",
  "breadcrumbs.datasets": "Conjuntos de dados",
  "breadcrumbs.recursos": "Recursos",
  "breadcrumbs.users": "Utilizadores",
};
const t = (key: string, options?: { defaultValue?: string }) =>
  dict[key] ?? options?.defaultValue ?? key;

describe("prettifySegment", () => {
  it("swaps hyphens/underscores for spaces and capitalizes each word", () => {
    expect(prettifySegment("como-usar-o-portal")).toBe("Como Usar O Portal");
    expect(prettifySegment("areas_tematicas")).toBe("Areas Tematicas");
  });

  it("URL-decodes and tolerates malformed encoding", () => {
    expect(prettifySegment("data%20stories")).toBe("Data Stories");
    expect(prettifySegment("100%")).toBe("100%");
  });
});

describe("buildBreadcrumbItems", () => {
  it("strips the leading locale and prepends Home", () => {
    const items = buildBreadcrumbItems({ path: "/pt/datasets", t });
    expect(items).toEqual([
      { label: "Início", url: "/" },
      { label: "Conjuntos de dados", url: "" },
    ]);
  });

  it("leaves the last item without a URL and links the intermediate ones", () => {
    const items = buildBreadcrumbItems({ path: "/pt/recursos/como-usar-o-portal", t });
    expect(items).toEqual([
      { label: "Início", url: "/" },
      { label: "Recursos", url: "/recursos" },
      { label: "Como Usar O Portal", url: "" },
    ]);
  });

  it("applies per-segment overrides (e.g. a dynamic id → its title)", () => {
    const items = buildBreadcrumbItems({
      path: "/pt/datasets/abc-123",
      t,
      overrides: { "abc-123": "My Dataset" },
    });
    expect(items).toEqual([
      { label: "Início", url: "/" },
      { label: "Conjuntos de dados", url: "/datasets" },
      { label: "My Dataset", url: "" },
    ]);
  });

  it("labels the last crumb via currentLabel whatever the segment is", () => {
    // Detail routes may carry either a slug or an id, so a value-keyed override
    // cannot be relied on — currentLabel matches by position instead.
    const bySlug = buildBreadcrumbItems({ path: "/pt/reuses/my-reuse", t, currentLabel: "A Reuse" });
    const byId = buildBreadcrumbItems({ path: "/pt/reuses/5f2c", t, currentLabel: "A Reuse" });

    expect(bySlug).toEqual([
      { label: "Início", url: "/" },
      { label: "Reuses", url: "/reuses" },
      { label: "A Reuse", url: "" },
    ]);
    expect(byId[byId.length - 1]).toEqual({ label: "A Reuse", url: "" });
  });

  it("lets currentLabel win over an override on the same segment", () => {
    const items = buildBreadcrumbItems({
      path: "/pt/datasets/abc-123",
      t,
      overrides: { "abc-123": "From override" },
      currentLabel: "From currentLabel",
    });
    expect(items[items.length - 1]).toEqual({ label: "From currentLabel", url: "" });
  });

  it("keeps overrides working on intermediate segments alongside currentLabel", () => {
    const items = buildBreadcrumbItems({
      path: "/pt/datasets/abc-123/discussions",
      t,
      overrides: { "abc-123": "My Dataset" },
      currentLabel: "Discussões",
    });
    expect(items).toEqual([
      { label: "Início", url: "/" },
      { label: "Conjuntos de dados", url: "/datasets" },
      { label: "My Dataset", url: "/datasets/abc-123" },
      { label: "Discussões", url: "" },
    ]);
  });

  it("resolves labels from the breadcrumbs namespace, not the top level", () => {
    // `t("datasets")` would resolve to a different content string; only the
    // namespaced key must be consulted.
    const flatOnly = (key: string, options?: { defaultValue?: string }) =>
      key === "datasets" ? "WRONG" : (options?.defaultValue ?? key);
    const items = buildBreadcrumbItems({ path: "/pt/datasets", t: flatOnly });
    expect(items[1].label).toBe("Datasets");
  });

  it("falls back to prettifySegment for segments without a translation key", () => {
    const items = buildBreadcrumbItems({ path: "/pt/areas-tematicas", t });
    expect(items).toEqual([
      { label: "Início", url: "/" },
      { label: "Areas Tematicas", url: "" },
    ]);
  });

  it("omits the Home crumb when includeHome is false", () => {
    const items = buildBreadcrumbItems({ path: "/pt/datasets", t, includeHome: false });
    expect(items).toEqual([{ label: "Conjuntos de dados", url: "" }]);
  });

  it("returns just Home for the localized root path", () => {
    const items = buildBreadcrumbItems({ path: "/pt", t });
    expect(items).toEqual([{ label: "Início", url: "/" }]);
  });
});

describe("sanitizeBreadcrumbItems", () => {
  it("blanks the URL of pageless nodes so they render as plain text", () => {
    // /users only exists as /users/[slug]; linking the parent would 404.
    const items = buildBreadcrumbItems({ path: "/pt/users/joao", t, currentLabel: "João" });
    expect(sanitizeBreadcrumbItems(items)).toEqual([
      { label: "Início", url: "/" },
      { label: "Utilizadores", url: "" },
      { label: "João", url: "" },
    ]);
  });

  it("blanks /recursos and its pageless sub-sections", () => {
    const items = buildBreadcrumbItems({
      path: "/pt/recursos/desenvolvimento/tutorial-api",
      t,
    });
    expect(sanitizeBreadcrumbItems(items)).toEqual([
      { label: "Início", url: "/" },
      { label: "Recursos", url: "" },
      { label: "Desenvolvimento", url: "" },
      { label: "Tutorial Api", url: "" },
    ]);
  });
});
