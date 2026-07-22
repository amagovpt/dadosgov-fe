import { describe, expect, it } from "vitest";
import { buildBreadcrumbItems, prettifySegment } from "../breadcrumbs";

// Fake i18next translator: resolves a few known keys, otherwise falls back to
// the caller-provided defaultValue (mirroring react-i18next's behaviour).
const dict: Record<string, string> = {
  home: "Início",
  datasets: "Conjuntos de dados",
  recursos: "Recursos",
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
