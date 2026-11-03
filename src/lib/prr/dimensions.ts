import type { SourceInfoFooterProps } from "@/components/Shared/SourceInfoFooter";
import type { TechnicalSheetModalData } from "@/service/types/modal/technical-sheet";
import type { SourceInfo } from "@/service/types/datastories/pt2030/pt2030";
import type {
  DimensionInvestmentCategory,
  DimensionMilestoneGraphicData,
  DimensionMilestoneTarget,
  DimensionReformCategory,
} from "@/service/types/datastories/prr/prr";


export type DimensionMilestoneStep = {
  year: string;
  value: number;
};

export type DimensionMilestone = {
  title: string;
  date: string;
  description: string;
  steps: DimensionMilestoneStep[];
  progressPercentage: number;
  isComplete: boolean;
  interventions: number | null;
};

export type DimensionFunding = {
  totalValue: number;
  spentValue: number;
  supportValue: number;
  loanValue: number;
};

export type DimensionDetailItem = {
  title: string;
  completionPercentage: number;
  description: string;
  expectedCompletionDate: string;
  funding?: DimensionFunding;
  milestones: DimensionMilestone[];
};

export type DimensionDetailCategory = {
  title: string;
  itemCount: number;
  completionPercentage: number;
  items: DimensionDetailItem[];
};

export function normalizeDimensionPercentage(value: number | null | undefined): number {
  const safeValue = Number(value ?? 0);
  return Number.isFinite(safeValue) ? safeValue * 100 : 0;
}

function parseInterventions(value: string | null | undefined): number | null {
  if (!value?.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseQuarterOrder(quarter: string | undefined): number {
  const match = quarter?.match(/([0-9]+)/);
  return match ? Number(match[1]) : 0;
}

function sortGraphicDataByPeriod(
  graphicData: DimensionMilestoneGraphicData[]
): DimensionMilestoneGraphicData[] {
  return [...graphicData].sort((a, b) => {
    const yearDiff = Number(a.year) - Number(b.year);
    return yearDiff !== 0 ? yearDiff : parseQuarterOrder(a.quarter) - parseQuarterOrder(b.quarter);
  });
}

function withInitialGraphicDataPoint(
  graphicData: DimensionMilestoneGraphicData[]
): DimensionMilestoneGraphicData[] {
  const hasInitialPoint = graphicData.some(
    (point) =>
      point.year === "2021" &&
      point.quarter === "T1" &&
      Number(point.baseline ?? 0) === 0 &&
      Number(point.objective ?? 0) === 0
  );

  if (hasInitialPoint) return graphicData;

  return [{ year: "2021", quarter: "T1", baseline: 0, objective: 0 }, ...graphicData];
}

export function convertDimensionPeriodToMonthYear(value: string, locale: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^([QTM])\s*([0-9]{1,2})\s+([0-9]{4})$/i);
  if (!match) return trimmed;

  const periodType = match[1].toUpperCase();
  const periodValue = Number(match[2]);
  const year = Number(match[3]);

  const isQuarter = periodType === "Q" || periodType === "T";
  if (periodValue < 1 || periodValue > (isQuarter ? 4 : 12)) return trimmed;

  const month = isQuarter ? periodValue * 3 : periodValue;
  const monthName = new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-US", {
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));

  return `${monthName} ${year}`;
}

export function mapDimensionMilestones(
  milestones: DimensionMilestoneTarget[] | null | undefined,
  locale: string
): DimensionMilestone[] {
  return (milestones ?? []).map((milestone) => ({
    title: milestone.executionIndicatorName,
    date: convertDimensionPeriodToMonthYear(milestone.dtConclusionMilestoneTarget || "", locale),
    description: milestone.dsExecutionIndicator || "",
    steps: milestone.hasGraph
      ? sortGraphicDataByPeriod(withInitialGraphicDataPoint(milestone.graphicData ?? [])).map(
          (point) => ({
            year: point.year,
            value: Number(point.objective ?? point.baseline ?? 0),
          })
        )
      : [],
    progressPercentage: normalizeDimensionPercentage(milestone.completionPercentage),
    isComplete: milestone.finished,
    interventions: parseInterventions(milestone.numberOfInterventions),
  }));
}

function byCompletionDesc<T extends { completionPercentage: number }>(a: T, b: T): number {
  return b.completionPercentage - a.completionPercentage;
}

export function buildInvestmentCategories(
  categories: DimensionInvestmentCategory[] | null | undefined,
  locale: string
): DimensionDetailCategory[] {
  return (categories ?? [])
    .map((category) => ({
      title: category.name,
      itemCount: category.number,
      completionPercentage: normalizeDimensionPercentage(category.completionPercentage),
      items: (category.investments ?? [])
        .map((investment) => ({
          title: investment.investmentName,
          completionPercentage: normalizeDimensionPercentage(investment.completionPercentage),
          description: investment.investmentDescription || "",
          expectedCompletionDate: convertDimensionPeriodToMonthYear(
            investment.completionDate || investment.investmentDateCompletion || "",
            locale
          ),
          funding: {
            totalValue: investment.assignedAmount ?? 0,
            spentValue: investment.amountSpent ?? 0,
            supportValue: investment.lostFundAmount ?? 0,
            loanValue: investment.loanValue ?? 0,
          },
          milestones: mapDimensionMilestones(investment.milestonesTargets, locale),
        }))
        .sort(byCompletionDesc),
    }))
    .sort(byCompletionDesc);
}

export function buildReformCategories(
  categories: DimensionReformCategory[] | null | undefined,
  locale: string
): DimensionDetailCategory[] {
  return (categories ?? [])
    .map((category) => ({
      title: category.name,
      itemCount: category.number,
      completionPercentage: normalizeDimensionPercentage(category.completionPercentage),
      items: (category.reforms ?? [])
        .map((reform) => ({
          title: reform.nameReform,
          completionPercentage: normalizeDimensionPercentage(reform.completionPercentage),
          description: reform.dsReform || "",
          expectedCompletionDate: convertDimensionPeriodToMonthYear(
            reform.completionDate || reform.renovationCompletionDate || "",
            locale
          ),
          milestones: mapDimensionMilestones(reform.milestonesTargets, locale),
        }))
        .sort(byCompletionDesc),
    }))
    .sort(byCompletionDesc);
}

export function getLatestSourceInfoDate(sourceInfo: SourceInfo[]): string {
  let latest = "";
  let latestTs = -Infinity;

  for (const source of sourceInfo) {
    for (const candidate of [
      source.referenceDate,
      source.updateDate,
      source.modificationDate,
      source.publicationDate,
    ]) {
      if (!candidate) continue;
      const ts = Date.parse(candidate);
      if (!Number.isNaN(ts) && ts > latestTs) {
        latestTs = ts;
        latest = candidate;
      }
    }
  }

  return latest;
}

export function buildDimensionSourceInfo(
  sourceInfo: SourceInfo[] | null | undefined,
  technicalSheet?: TechnicalSheetModalData
): SourceInfoFooterProps | undefined {
  if (!sourceInfo?.length) return undefined;

  return {
    dataSource: sourceInfo[0].source ?? "",
    update: getLatestSourceInfoDate(sourceInfo),
    technicalSheet,
  };
}
