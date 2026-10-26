import { Section } from "../../shared/common";
import { DatastoryHero, SourceSection } from "../datastory";

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

// ----------------------------------------------------------------------------------------------

/** PROJECT **/

export type Project = {
  hero: DatastoryHero;
  projectSheet: Section;
  beneficiaries: Section;
  applications: Section;
  publicContracting: Section;
  geographicDistribution: Section;
  datasets: SourceSection;
};

export type ApplicationTabData = {
  codigoAviso: string;
  criteriosSelecao?: string;
  notaFinal: string;
  designacaoAviso: string;
  link?: string;
  baseScore?: string;
};

export type FinancialEntity = {
  nif_entidade: string;
  nome: string;
  valor_financiamento: number;
  valor_pago?: number;
};

export type DistributionItem = {
  descricao: string;
  valor_financiamento: number;
};

export type TerritorialDistribution = {
  tipo: "concelho" | "distrito" | "subregiao" | "regiao";
  order: number;
  distribuicao: DistributionItem[];
};

export type TransversalDistribution = {
  tipo: "transversal";
  pc_valor_executado: number;
  distribuicao_indefinida: number | null;
  valor_financiamento_total: string;
};

export type GeographicDistribution = TerritorialDistribution | TransversalDistribution;

export type ProjectViewData = {
  codigoProjeto: string;
  nome: string;
  valorTotalProjeto: number;
  valorPago: number;
  financiamentoNaoReembolsavel: number;
  financiamentoEmprestimos: number;
  dataInicio: string;
  dataConclusao: string;
  dimensao: string;
  componente: string;
  investimento: string;
  codigoOperacao: string;
  sumario: string;
  applicationTab: ApplicationTabData;
  beneficiaryData: {
    intermediate: ProjectSheetBeneficiaryFinancingGroup;
    beneficiaries: ProjectSheetBeneficiaryFinancingGroup;
    partners: ProjectSheetBeneficiaryFinancingGroup;
    suppliers: ProjectSheetBeneficiaryFinancingGroup;
  };
  geographicDistributionData: GeographicDistribution[];
  geographicDistributionSourceInfo: {
    source: string | null;
    sourceLink: string | null;
    referenceDate: string | null;
  };
  publicContractingData: ProjectSheetContractsTab | null;
  contestAndContractsData: ProjectSheetContestAndContractsTab | null;
};

export type ProjectSheetGeoDivision = {
  description: string;
  value: number;
};

export type ProjectSheetGeoDistribution = {
  type: string;
  divisions: ProjectSheetGeoDivision[];
};

export type ProjectSheetContractDetailItem = {
  link: string | null;
  name: string | null;
  value: number | null;
};

export type ProjectSheetContractDetails = {
  contractsCount: number | null;
  contractsValue: number | null;
  principalDescription: string | null;
  secondaryDescription: string | null;
  detailContract: ProjectSheetContractDetailItem[] | null;
};

export type ProjectSheetContractsTab = {
  tabName: string | null;
  contractsCount: number | null;
  totalContractsValue: number | null;
  contractDetails: ProjectSheetContractDetails | null;
};

export type ProjectSheetContestAndContractsTab = {
  tabName: string | null;
  criteria: string[] | null;
  contractDetails: ProjectSheetContractDetails | null;
};

export type ProjectSheetBeneficiaryFinancingType =
  "BENEFICIARY" | "INTERMEDIARY_BENEFICIARY" | "PARTNER" | "SUPPLIER";

export type ProjectSheetBeneficiaryFinancingItem = {
  description: number | null;
  id: string | null;
  name: string | null;
  paid: number | null;
};

export type ProjectSheetBeneficiaryFinancingResponse = {
  beneficiaryType: ProjectSheetBeneficiaryFinancingType;
  data: ProjectSheetBeneficiaryFinancingItem[];
  limit: number;
  page: number;
  total: number;
  totalFiltered: number;
};

export type ProjectSheetBeneficiaryFinancingGroup = {
  beneficiaryType: ProjectSheetBeneficiaryFinancingType;
  items: FinancialEntity[];
  limit: number;
  page: number;
  total: number;
  totalFiltered: number;
};

export type ProjectSheetOfPRRData = {
  code: string | null;
  projectForm: {
    component: string | null;
    dimension: string | null;
    executedValue: number | null;
    grantFunding: number | null;
    investment: string | null;
    loanFunding: number | null;
    name: string | null;
    plannedConclusionDate: string | null;
    startDate: string | null;
    summary: string | null;
    totalProjectValue: number | null;
  } | null;
  tabs: {
    candidature: {
      baseScore: string | null;
      finalScore: string | null;
      tabName: string | null;
      link: string | null;
    } | null;
    contracts: ProjectSheetContractsTab | null;
    contestAndContracts: ProjectSheetContestAndContractsTab | null;
    geoDistributionFinancing: {
      tabName: string | null;
      source: string | null;
      sourceLink: string | null;
      referenceDate: string | null;
      valuePercentage: number | null;
      distribution: ProjectSheetGeoDistribution[] | null;
    } | null;
  } | null;
};
