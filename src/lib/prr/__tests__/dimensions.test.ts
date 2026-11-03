import { describe, expect, it } from "vitest";
import {
  buildDimensionSourceInfo,
  buildInvestmentCategories,
  buildReformCategories,
  convertDimensionPeriodToMonthYear,
  getLatestSourceInfoDate,
  mapDimensionMilestones,
  normalizeDimensionPercentage,
} from "../dimensions";
import type {
  DimensionInvestment,
  DimensionMilestoneTarget,
  DimensionReform,
} from "@/service/types/datastories/prr/prr";
import type { SourceInfo } from "@/service/types/datastories/pt2030/pt2030";

const milestone = (
  overrides: Partial<DimensionMilestoneTarget> = {}
): DimensionMilestoneTarget => ({
  hasGraph: false,
  milestoneOrTarget: "Target",
  completionPercentage: 0.5,
  dsExecutionIndicator: "Descrição",
  dtConclusionMilestoneTarget: "Q2 2025",
  executionIndicatorName: "Indicador",
  numberOfInterventions: "",
  finished: false,
  graphicData: [],
  ...overrides,
});

const investment = (overrides: Partial<DimensionInvestment> = {}): DimensionInvestment => ({
  amountSpent: 10,
  assignedAmount: 20,
  cdInvestment: "RE-C01-i01",
  completionDate: "Q2 2025",
  completionPercentage: 0.5,
  finished: false,
  idInvestment: "ID1",
  investmentDateCompletion: "",
  investmentDescription: "",
  investmentName: "Investimento",
  loanValue: 5,
  lostFundAmount: 15,
  milestonesTargets: [],
  ...overrides,
});

const reform = (overrides: Partial<DimensionReform> = {}): DimensionReform => ({
  amountSpent: 0,
  assignedAmount: 0,
  cdReform: "RE-C22-r49",
  completionDate: "",
  completionPercentage: 1,
  dsReform: "",
  finished: true,
  milestonesTargets: null,
  nameReform: "Reforma",
  reformId: "ID23",
  renovationCompletionDate: "M10 2023",
  ...overrides,
});

const source = (overrides: Partial<SourceInfo> = {}): SourceInfo => ({
  format: "xlsx",
  modificationDate: "",
  publicationDate: "",
  source: "EMRP",
  referenceDate: "",
  sourceLink: "",
  title: "lista.xlsx",
  updateDate: "",
  url: "",
  ...overrides,
});

describe("normalizeDimensionPercentage", () => {
  it("turns the CMS ratio into a percentage", () => {
    expect(normalizeDimensionPercentage(0.5)).toBe(50);
    expect(normalizeDimensionPercentage(1)).toBe(100);
  });

  it("falls back to 0 on missing or invalid values", () => {
    expect(normalizeDimensionPercentage(null)).toBe(0);
    expect(normalizeDimensionPercentage(undefined)).toBe(0);
    expect(normalizeDimensionPercentage(Number.NaN)).toBe(0);
  });
});

describe("convertDimensionPeriodToMonthYear", () => {
  it("shows a quarter as its last month", () => {
    expect(convertDimensionPeriodToMonthYear("Q2 2025", "pt")).toBe("junho 2025");
    expect(convertDimensionPeriodToMonthYear("T4 2026", "pt")).toBe("dezembro 2026");
    expect(convertDimensionPeriodToMonthYear("Q1 2024", "en")).toBe("March 2024");
  });

  it("shows a month period as that month", () => {
    expect(convertDimensionPeriodToMonthYear("M10 2023", "pt")).toBe("outubro 2023");
  });

  it("returns anything it does not recognise unchanged", () => {
    expect(convertDimensionPeriodToMonthYear("Q5 2025", "pt")).toBe("Q5 2025");
    expect(convertDimensionPeriodToMonthYear("M13 2025", "pt")).toBe("M13 2025");
    expect(convertDimensionPeriodToMonthYear(" 2025 ", "pt")).toBe("2025");
    expect(convertDimensionPeriodToMonthYear("", "pt")).toBe("");
  });
});

describe("mapDimensionMilestones", () => {
  it("returns an empty list when the CMS sends none", () => {
    expect(mapDimensionMilestones(null, "pt")).toEqual([]);
  });

  it("leaves the steps empty when the milestone has no graph", () => {
    const [mapped] = mapDimensionMilestones([milestone()], "pt");
    expect(mapped).toMatchObject({
      title: "Indicador",
      date: "junho 2025",
      description: "Descrição",
      steps: [],
      progressPercentage: 50,
      isComplete: false,
      interventions: null,
    });
  });

  it("reads the interventions the CMS sends as text", () => {
    const [known, invalid] = mapDimensionMilestones(
      [milestone({ numberOfInterventions: "3520" }), milestone({ numberOfInterventions: "n/a" })],
      "pt"
    );
    expect(known.interventions).toBe(3520);
    expect(invalid.interventions).toBeNull();
  });

  it("sorts the graph by period and starts it at zero in 2021 T1", () => {
    const [mapped] = mapDimensionMilestones(
      [
        milestone({
          hasGraph: true,
          graphicData: [
            { year: "2025", quarter: "T2", baseline: null, objective: 3600 },
            { year: "2023", quarter: "T4", baseline: 100, objective: null },
            { year: "2023", quarter: "T1", baseline: null, objective: 50 },
          ],
        }),
      ],
      "pt"
    );

    expect(mapped.steps).toEqual([
      { year: "2021", value: 0 },
      { year: "2023", value: 50 },
      { year: "2023", value: 100 },
      { year: "2025", value: 3600 },
    ]);
  });

  it("does not add a second initial point", () => {
    const [mapped] = mapDimensionMilestones(
      [
        milestone({
          hasGraph: true,
          graphicData: [
            { year: "2021", quarter: "T1", baseline: 0, objective: 0 },
            { year: "2022", quarter: "T1", baseline: null, objective: 10 },
          ],
        }),
      ],
      "pt"
    );

    expect(mapped.steps).toHaveLength(2);
  });
});

describe("buildInvestmentCategories", () => {
  it("maps categories and items, both sorted by completion", () => {
    const categories = buildInvestmentCategories(
      [
        {
          id: "C01",
          name: "Habitação",
          number: 2,
          completionPercentage: 0.4,
          investments: [
            investment({ investmentName: "A", completionPercentage: 0.2 }),
            investment({ investmentName: "B", completionPercentage: 0.9 }),
          ],
        },
        {
          id: "C02",
          name: "Cultura",
          number: 1,
          completionPercentage: 0.8,
          investments: null,
        },
      ],
      "pt"
    );

    expect(categories.map((category) => category.title)).toEqual(["Cultura", "Habitação"]);
    expect(categories[0].items).toEqual([]);
    expect(categories[1]).toMatchObject({ itemCount: 2, completionPercentage: 40 });
    expect(categories[1].items.map((item) => item.title)).toEqual(["B", "A"]);
    expect(categories[1].items[0]).toMatchObject({
      expectedCompletionDate: "junho 2025",
      funding: { totalValue: 20, spentValue: 10, supportValue: 15, loanValue: 5 },
    });
  });

  it("returns an empty list when the CMS sends no data", () => {
    expect(buildInvestmentCategories(null, "pt")).toEqual([]);
  });
});

describe("buildReformCategories", () => {
  it("falls back to the renovation date and leaves funding out", () => {
    const [category] = buildReformCategories(
      [{ id: "C22", name: "Auditoria", number: 1, completionPercentage: 1, reforms: [reform()] }],
      "pt"
    );

    expect(category.items[0]).toEqual({
      title: "Reforma",
      completionPercentage: 100,
      description: "",
      expectedCompletionDate: "outubro 2023",
      milestones: [],
    });
  });
});

describe("getLatestSourceInfoDate", () => {
  it("picks the most recent date across all sources and fields", () => {
    expect(
      getLatestSourceInfoDate([
        source({ referenceDate: "2025-12-31", modificationDate: "2026-05-15T17:26:01.071" }),
        source({ referenceDate: "2026-10-21", updateDate: "" }),
      ])
    ).toBe("2026-10-21");
  });

  it("returns an empty string when no date parses", () => {
    expect(getLatestSourceInfoDate([source({ referenceDate: "n/a" })])).toBe("");
  });
});

describe("buildDimensionSourceInfo", () => {
  it("is undefined without sources, so the footer is not rendered", () => {
    expect(buildDimensionSourceInfo(null)).toBeUndefined();
    expect(buildDimensionSourceInfo([])).toBeUndefined();
  });

  it("uses the first source name and the latest date", () => {
    expect(buildDimensionSourceInfo([source({ referenceDate: "2026-10-21" })])).toEqual({
      dataSource: "EMRP",
      update: "2026-10-21",
      technicalSheet: undefined,
    });
  });
});
