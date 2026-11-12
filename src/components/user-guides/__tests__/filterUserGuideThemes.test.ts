import { describe, expect, it } from "vitest";
import type { UserGuideTheme } from "@/service/types/user-guides";
import { filterUserGuideThemes } from "../filterUserGuideThemes";

const themes: UserGuideTheme[] = [
  {
    id: "encontrar",
    title: "Encontrar, consultar e explorar dados",
    description: "",
    guides: [
      { id: "encontrar-e-consultar-dados", title: "Encontrar e consultar dados", cardDescription: "Refine a pesquisa." },
      { id: "explorador-de-dados", title: "Explorador de dados", cardDescription: "Crie gráficos." },
    ],
  },
  {
    id: "organizacoes",
    title: "Organizações",
    description: "",
    guides: [
      { id: "organizacoes-e-permissoes", title: "Organizações e permissões", cardDescription: "Gira os membros." },
    ],
  },
];

describe("filterUserGuideThemes", () => {
  it("returns every theme for an empty term", () => {
    expect(filterUserGuideThemes(themes, "")).toBe(themes);
    expect(filterUserGuideThemes(themes, "  ")).toBe(themes);
  });

  it("matches title and description ignoring case and accents", () => {
    const result = filterUserGuideThemes(themes, "GRAFICOS");

    expect(result).toHaveLength(1);
    expect(result[0].guides.map((guide) => guide.id)).toEqual(["explorador-de-dados"]);
  });

  it("matches multi-word terms and drops themes left empty", () => {
    const result = filterUserGuideThemes(themes, "organizações e");

    expect(result.map((theme) => theme.id)).toEqual(["organizacoes"]);
  });

  it("returns nothing when no guide matches", () => {
    expect(filterUserGuideThemes(themes, "harvester")).toEqual([]);
  });
});
