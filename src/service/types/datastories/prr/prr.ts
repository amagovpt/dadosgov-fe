// ----------------------------------------------------------------------------------------------

/** SEARCH PAGES **/

export type QueryFiltersPrr = {
  dimensions: string[];
  regions: string[];
  municipalities: string[];
};

export type QueryProjectsFiltersPrr = {
  dimensions: string[];
  regions: string[];
  municipalities: string[];
  amounts: string[];
  conclusionDate: string[];
};

/** Headline numbers of the projects page (`queryProjectsTotalsOfPRR`). */
export type ProjectsTotalsOfPRR = {
  projects: number;
  approvedValue: number;
  executedValue: number;
  endDateMin: string | null;
  endDateMax: string | null;
};

/** Row of `searchProjectsOfPRR`, limited to the fields the listing reads. */
export type PRRSearchProjectItem = {
  code: string | null;
  description: string | null;
  investment: string | null;
  dimension: string | null;
  dsNutsii: string | null;
  dsMunicipality: string | null;
  budget: number | null;
  total: number | null;
  executedValue: number | null;
  endDate: string | null;
};

export type PRRSearchProjectsResponse = {
  data: PRRSearchProjectItem[];
  filters: {
    budgetMax: number | null;
    budgetMin: number | null;
    endDateMax: string | null;
    endDateMin: string | null;
  } | null;
  limit: number;
  page: number;
  total: number;
  totalFiltered: number;
};

/** A PRR project mapped onto the field names the shared search store and results expect. */
export type ProjectResponseItemPrr = {
  operationCode: string;
  operationName: string;
  dimension: string;
  region: string;
  municipality: string;
  approvedValue: number;
  executedValue: number;
  paidValue: number;
  plannedConclusionDate: string;
  effectiveConclusionDate?: string | null;
};

export type SearchProjectsPrrRequestBody = {
  limit?: number;
  page?: number;
  sortBy?: "APPROVED_VALUE" | "EXECUTED_VALUE" | "PAID_VALUE" | "PLANNED_CONCLUSION_DATE";
  sortOrder?: "ASC" | "DESC";
  name?: string;
  operationCode?: string;
  dimensions?: string;
  regions?: string;
  municipalities?: string;
  approvedValueMin?: number;
  approvedValueMax?: number;
  executedValueMin?: number;
  executedValueMax?: number;
  paidValueMin?: number;
  paidValueMax?: number;
  conclusionDate?: string;
  conclusionDateMin?: string;
  conclusionDateMax?: string;
};
