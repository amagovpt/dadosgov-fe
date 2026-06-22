import { describe, expect, it } from "vitest";
import {
  buildDatasetCreatePayload,
  parseDatasetDateToTime,
  toDatasetIsoDate,
  validateDatasetDetails,
} from "./datasetFormModel";

const emptyDraft = {
  id: 1,
  name: "",
  email: "",
  link: "",
  saved: false,
  errors: {},
};

describe("datasetFormModel", () => {
  it("parses the date formats supported by the existing wizard", () => {
    expect(parseDatasetDateToTime("31/01/2026")).not.toBeNull();
    expect(parseDatasetDateToTime("2026-01-31")).not.toBeNull();
    expect(parseDatasetDateToTime("31/02/2026")).toBeNull();
    expect(parseDatasetDateToTime("not-a-date")).toBeNull();
    expect(toDatasetIsoDate("31-01-2026")).toBe("2026-01-31T00:00:00.000Z");
    expect(toDatasetIsoDate("2026-01-31T12:30:00Z")).toBe("2026-01-31T00:00:00.000Z");
  });

  it("returns all required-field and temporal errors together", () => {
    const result = validateDatasetDetails({
      producer: "",
      title: "",
      description: "",
      frequency: "",
      temporalStart: "31/12/2026",
      temporalEnd: "01/01/2026",
      selectedProducer: "user",
      selectedContactPointIds: [],
      draftContacts: [emptyDraft],
    });

    expect(result.errors).toMatchObject({
      datasetProducer: expect.any(String),
      datasetTitle: expect.any(String),
      datasetDescription: expect.any(String),
      datasetFrequency: expect.any(String),
      temporalCoverage: expect.any(String),
    });
  });

  it("validates organization contact drafts without mutating them", () => {
    const drafts = [{ ...emptyDraft, errors: {} }];
    const result = validateDatasetDetails({
      producer: "org-id",
      title: "Dataset",
      description: "Description",
      frequency: "annual",
      temporalStart: "",
      temporalEnd: "",
      selectedProducer: "org-id",
      selectedContactPointIds: [],
      draftContacts: drafts,
    });

    expect(result.errors.contactDrafts).toEqual(expect.any(String));
    expect(result.draftErrors).toEqual({ 1: { name: true, email: true, link: true } });
    expect(drafts[0].errors).toEqual({});
  });

  it("accepts either a saved contact or a valid draft for organizations", () => {
    const base = {
      producer: "org-id",
      title: "Dataset",
      description: "Description",
      frequency: "annual",
      temporalStart: "",
      temporalEnd: "",
      selectedProducer: "org-id",
    };

    expect(
      validateDatasetDetails({
        ...base,
        selectedContactPointIds: ["contact-id"],
        draftContacts: [emptyDraft],
      }).errors.contactDrafts,
    ).toBeUndefined();
    expect(
      validateDatasetDetails({
        ...base,
        selectedContactPointIds: [],
        draftContacts: [{ ...emptyDraft, name: "AMA", email: "dados@example.pt" }],
      }).errors.contactDrafts,
    ).toBeUndefined();
  });

  it("builds the active dataset creation payload", () => {
    expect(
      buildDatasetCreatePayload({
        title: " Dados abertos ",
        acronym: " DA ",
        description: " Descrição pública ",
        shortDescription: " Resumo ",
        producer: "org-id",
        license: "cc-by",
        frequency: "annual",
        keywords: "dados,governo",
        contactPointIds: ["contact-id"],
        temporalStart: "01/01/2026",
        temporalEnd: "31/12/2026",
      }),
    ).toEqual({
      title: "Dados abertos",
      acronym: "DA",
      description: "Descrição pública",
      description_short: "Resumo",
      organization: "org-id",
      license: "cc-by",
      frequency: "annual",
      tags: ["dados", "governo"],
      contact_points: ["contact-id"],
      temporal_coverage: {
        start: "2026-01-01T00:00:00.000Z",
        end: "2026-12-31T00:00:00.000Z",
      },
      private: true,
    });
  });

  it("preserves the generated 200-character short description", () => {
    const description = "a".repeat(250);
    const payload = buildDatasetCreatePayload({
      title: "Dataset",
      acronym: "",
      description,
      shortDescription: "",
      producer: "user",
      license: "",
      frequency: "annual",
      keywords: "",
      contactPointIds: [],
      temporalStart: "",
      temporalEnd: "",
    });

    expect(payload.description_short).toBe(`${"a".repeat(197)}...`);
    expect(payload).not.toHaveProperty("organization");
  });
});
