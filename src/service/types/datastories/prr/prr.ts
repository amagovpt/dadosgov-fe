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

export type QueryBeneficiariesFiltersPrr = {
  dimensions: string[];
  regions: string[];
  municipalities: string[];
  amounts: string[];
  projectsAmount: string[];
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

/** Row of `searchBeneficiariesOfPRR`, limited to the fields the listing reads. */
export type PRRSearchBeneficiaryItem = {
  recipientId: string | null;
  recipientName: string | null;
  recipientType: string | null;
  dimension: string | null;
  dsNutsii: string | null;
  dsMunicipalities: string | null;
  numProjects: number | null;
  budget: number | null;
  paidBudget: number | null;
  finalRecipient: boolean | null;
  intermediaryRecipient: boolean | null;
  supplierRecipient: boolean | null;
  partnerRecipient: boolean | null;
};

export type PRRSearchBeneficiariesResponse = {
  data: PRRSearchBeneficiaryItem[];
  filters: {
    budgetMax: number | null;
    budgetMin: number | null;
    paidBudgetMax: number | null;
    paidBudgetMin: number | null;
    projectsAmountMax: number | null;
    projectsAmountMin: number | null;
  } | null;
  limit: number;
  page: number;
  total: number;
  totalFiltered: number;
};

/** A PRR beneficiary mapped onto the field names the shared search store and results expect. */
export type BeneficiaryResponseItemPrr = {
  entityName: string;
  entityNif: string;
  entityRole: string;
  dimension: string;
  region: string;
  municipality: string;
  projectsAmount: number;
  approvedValue: number;
  paidValue: number;
  approvedValueIntermediateBeneficiaries: number;
  approvedValueBeneficiaries: number;
  approvedValueSuppliers: number;
  approvedValuePartners: number;
  paidValueIntermediateBeneficiaries: number;
  paidValueBeneficiaries: number;
  paidValueSuppliers: number;
  paidValuePartners: number;
};

/** Beneficiary types of the PRR search, as the store sends them in `entityRole`. */
export type BeneficiaryTypePrr =
  "intermediateBeneficiaries" | "beneficiaries" | "suppliers" | "partners";

export type SearchBeneficiariesPrrRequestBody = {
  limit?: number;
  page?: number;
  sortBy?: "APPROVED_VALUE" | "EXECUTED_VALUE" | "PAID_VALUE" | "PROJECTS_AMOUNT";
  sortOrder?: "ASC" | "DESC";
  name?: string;
  nif?: string;
  entityRole?: BeneficiaryTypePrr[];
  dimensions?: string;
  regions?: string;
  municipalities?: string;
  approvedValueMin?: number;
  approvedValueMax?: number;
  executedValueMin?: number;
  executedValueMax?: number;
  paidValueMin?: number;
  paidValueMax?: number;
  projectsAmountMin?: number;
  projectsAmountMax?: number;
};
