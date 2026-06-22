import { describe, expect, it } from "vitest";
import {
  buildRemoteDatasetEntries,
  buildReuseCreatePayload,
  normalizeReuseUrl,
  validateReuseDatasetSelection,
  validateReuseDetails,
} from "./reuseFormModel";

describe("reuseFormModel", () => {
  it("normalizes URLs without changing already valid values", () => {
    expect(normalizeReuseUrl(" example.pt/reuse ")).toBe("https://example.pt/reuse");
    expect(normalizeReuseUrl("http://example.pt/reuse")).toBe("http://example.pt/reuse");
    expect(normalizeReuseUrl("not a url")).toBeNull();
    expect(normalizeReuseUrl(" ")).toBeNull();
  });

  it("returns all detail validation errors in one pass", () => {
    expect(
      validateReuseDetails({
        name: "",
        url: "not a url",
        type: "",
        topic: "",
        description: "",
      }),
    ).toEqual({
      reuseName: "Indique o nome da reutilização.",
      reuseLink: "Indique um URL válido.",
      reuseType: "Selecione o tipo de reutilização.",
      reuseTopic: "Selecione o tema da reutilização.",
      reuseDescription: "Descreva a reutilização.",
    });
  });

  it("builds a trimmed payload and deduplicates keywords", () => {
    expect(
      buildReuseCreatePayload({
        name: "  Aplicação municipal ",
        url: "example.pt/app",
        type: " application ",
        topic: " transport ",
        description: "  Uma reutilização útil. ",
        producer: " organization-id ",
        keywords: "mobilidade, Dados, mobilidade, dados abertos",
      }),
    ).toEqual({
      title: "Aplicação municipal",
      description: "Uma reutilização útil.",
      url: "https://example.pt/app",
      type: "application",
      topic: "transport",
      private: true,
      tags: ["mobilidade", "Dados", "dados abertos"],
      organization: "organization-id",
    });
  });

  it("omits optional producer and tags for a personal reuse", () => {
    const payload = buildReuseCreatePayload({
      name: "Reuse",
      url: "https://example.pt",
      type: "application",
      topic: "",
      description: "Description",
      producer: "user",
      keywords: [],
    });

    expect(payload).not.toHaveProperty("organization");
    expect(payload).not.toHaveProperty("tags");
    expect(payload).not.toHaveProperty("topic");
  });

  it("normalizes and deduplicates remote dataset entries", () => {
    expect(
      buildRemoteDatasetEntries([
        { url: " https://example.pt/data ", title: " First ", description: " " },
        { url: "https://example.pt/data", title: "Ignored duplicate" },
        { url: "", title: "Ignored empty URL" },
      ]),
    ).toEqual([
      {
        url: "https://example.pt/data",
        title: "First",
        description: undefined,
      },
    ]);
  });

  it("rejects mixing local and remote datasets", () => {
    const remote = [{ url: "https://example.pt/data" }];
    expect(validateReuseDatasetSelection(1, remote)).toContain("não as duas opções");
    expect(validateReuseDatasetSelection(0, remote)).toBeNull();
    expect(validateReuseDatasetSelection(1, [])).toBeNull();
  });
});
