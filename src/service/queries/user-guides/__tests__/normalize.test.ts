import { describe, expect, it } from "vitest";
import { flattenData } from "@/utils/flattenObject";
import { normalizeUserGuide, normalizeUserGuidesPage } from "../normalize";

// Raw Squidex GraphQL `data` for one guide, as returned by `getUserGuide`'s query.
const rawGuide = {
  id: { iv: "encontrar-e-consultar-dados" },
  title: { pt: "Encontrar e consultar dados" },
  cardDescription: { pt: "Encontre Conjuntos de Dados." },
  description: { pt: "Encontre Conjuntos de Dados, refine a pesquisa." },
  requirementNote: { pt: null },
  status: { iv: "available" },
  statusNotice: { pt: null },
  pdf: { pt: [{ id: "a1", url: "/a1", fileName: "guia.pdf", slug: "guia.pdf", fileSize: 1, fileType: "pdf" }] },
  tasks: {
    pt: [
      {
        id: "encontrar-dados",
        title: "Encontrar dados",
        audience: null,
        objective: "Encontrar conjuntos de dados relevantes.",
        steps: [{ text: "Aceda à área Conjuntos de Dados." }, { text: "Escreva uma palavra." }],
        example: "Pesquise por \"transportes Lisboa\".",
        videoUrl: "https://youtu.be/dQw4w9WgXcQ",
        video: [],
        mediaCaption: null,
        tip: "Utilize termos simples.",
      },
      { id: "", title: "Sem âncora", steps: null },
    ],
  },
  relatedGuides: {
    iv: [
      { data: { id: { iv: "explorador-de-dados" }, title: { pt: "Explorador de dados" }, cardDescription: { pt: "Consulte uma tabela." } } },
      { data: { id: { iv: "encontrar-e-consultar-dados" }, title: { pt: "Ele próprio" }, cardDescription: { pt: "" } } },
    ],
  },
  usefulResources: { pt: [{ label: "Minicurso", url: "/recursos/aprender" }, { label: "", url: "/x" }] },
  updatedAt: { iv: "2025-03-31T00:00:00Z" },
};

describe("normalizeUserGuide", () => {
  it("maps flattened CMS data to a fully populated guide", () => {
    const guide = normalizeUserGuide(flattenData(rawGuide, "pt"));

    expect(guide).not.toBeNull();
    expect(guide?.id).toBe("encontrar-e-consultar-dados");
    expect(guide?.status).toBe("available");
    expect(guide?.requirementNote).toBe("");
    expect(guide?.pdf[0].slug).toBe("guia.pdf");
    expect(guide?.updatedAt).toBe("2025-03-31T00:00:00Z");
  });

  it("unwraps single-field steps and drops tasks without an anchor", () => {
    const guide = normalizeUserGuide(flattenData(rawGuide, "pt"));

    expect(guide?.tasks).toHaveLength(1);
    expect(guide?.tasks[0].steps).toEqual([
      "Aceda à área Conjuntos de Dados.",
      "Escreva uma palavra.",
    ]);
    expect(guide?.tasks[0].audience).toBe("");
    expect(guide?.tasks[0].video).toEqual([]);
  });

  it("keeps related guides other than itself and complete useful resources", () => {
    const guide = normalizeUserGuide(flattenData(rawGuide, "pt"));

    expect(guide?.relatedGuides).toEqual([
      { id: "explorador-de-dados", title: "Explorador de dados", cardDescription: "Consulte uma tabela." },
    ]);
    expect(guide?.usefulResources).toEqual([{ label: "Minicurso", url: "/recursos/aprender" }]);
  });

  it("treats any status other than unavailable as available", () => {
    expect(normalizeUserGuide({ id: "a", title: "A", status: "unavailable" })?.status).toBe(
      "unavailable"
    );
    expect(normalizeUserGuide({ id: "a", title: "A", status: null })?.status).toBe("available");
  });

  it("returns null without a slug or title", () => {
    expect(normalizeUserGuide(null)).toBeNull();
    expect(normalizeUserGuide({ id: "a", title: null })).toBeNull();
    expect(normalizeUserGuide({ id: null, title: "A" })).toBeNull();
  });

  it("fills every collection when the CMS fields are empty", () => {
    const guide = normalizeUserGuide({ id: "a", title: "A" });

    expect(guide).toMatchObject({
      pdf: [],
      tasks: [],
      relatedGuides: [],
      usefulResources: [],
      description: "",
    });
  });
});

describe("normalizeUserGuidesPage", () => {
  it("maps themes with their referenced guides", () => {
    const raw = {
      findUserGuidesPageSingleton: {
        data: {
          title: { pt: "Guias do utilizador" },
          description: { pt: "Encontre instruções práticas." },
          searchLabel: { pt: "Diga-nos o que procura" },
          searchPlaceholder: { pt: null },
          heroImage: { iv: null },
          updatedAt: { iv: "2025-03-31T00:00:00Z" },
          themes: {
            pt: [
              {
                id: "encontrar-consultar-e-explorar-dados",
                title: "Encontrar, consultar e explorar dados",
                description: "Pesquise Conjuntos de Dados.",
                guides: [
                  { data: { id: { iv: "encontrar-e-consultar-dados" }, title: { pt: "Encontrar e consultar dados" }, cardDescription: { pt: "Encontre." } } },
                ],
              },
              { id: "sem-titulo", title: null, description: null, guides: null },
            ],
          },
        },
      },
    };

    const page = normalizeUserGuidesPage(flattenData(raw, "pt").findUserGuidesPageSingleton);

    expect(page.title).toBe("Guias do utilizador");
    expect(page.searchPlaceholder).toBe("");
    expect(page.heroImage).toEqual([]);
    expect(page.themes).toHaveLength(1);
    expect(page.themes[0].guides).toEqual([
      { id: "encontrar-e-consultar-dados", title: "Encontrar e consultar dados", cardDescription: "Encontre." },
    ]);
  });

  it("returns an empty page for missing data", () => {
    expect(normalizeUserGuidesPage(undefined)).toMatchObject({ title: "", themes: [] });
  });
});
