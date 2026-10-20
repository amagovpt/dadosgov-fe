import { ObjectType, Field, Float, Int, registerEnumType } from 'type-graphql';
import { SourceInfo, SortOrder } from '@/@types/shared-types';

export { SortOrder };

// Enums for sorting
export enum BeneficiariesSortByPRR {
  BUDGET = 'budget',
  PAID_BUDGET = 'paidBudget',
  PROJECTS_AMOUNT = 'numProjects',
}

export enum ProjectsSortByPRR {
  BUDGET = 'budget',
  END_DATE = 'endDate',
}

export enum ProjectSheetBeneficiaryTypeOfPRR {
  BENEFICIARY = 'beneficiary',
  INTERMEDIARY_BENEFICIARY = 'intermediaryBeneficiary',
  PARTNER = 'partner',
  SUPPLIER = 'supplier',
}

export enum BeneficiaryProjectType {
  SUPPLIER = 'supplier',
  BENEFICIARY = 'beneficiary',
  INTERMEDIARY = 'intermediary',
  PARTNER = 'partner',
}

registerEnumType(BeneficiariesSortByPRR, {
  name: 'BeneficiariesSortByPRR',
  description: 'Fields available for sorting beneficiaries',
});

registerEnumType(ProjectsSortByPRR, {
  name: 'ProjectsSortByPRR',
  description: 'Fields available for sorting projects',
});

registerEnumType(ProjectSheetBeneficiaryTypeOfPRR, {
  name: 'ProjectSheetBeneficiaryTypeOfPRR',
  description: 'Beneficiary list types available in project sheet financing',
});

registerEnumType(BeneficiaryProjectType, {
  name: 'BeneficiaryProjectType',
  description: 'Types of beneficiary projects',
});

@ObjectType()
export class BeneficiariesSearchOfPRRData {
  @Field(() => String)
  recipientId: string;

  @Field(() => String)
  recipientName: string;

  @Field(() => String)
  recipientType: string;

  @Field(() => Float)
  budget: number;

  @Field(() => Float)
  paidBudget: number;

  @Field(() => Int)
  numProjects: number;

  @Field(() => String)
  benefType: string;

  @Field(() => String)
  economicActivity: string;

  @Field(() => Boolean)
  finalRecipient: boolean;

  @Field(() => Boolean)
  intermediaryRecipient: boolean;

  @Field(() => Boolean)
  supplierRecipient: boolean;

  @Field(() => Boolean)
  partnerRecipient: boolean;

  @Field(() => String, { nullable: true })
  cdDimension: string | null;

  @Field(() => String, { nullable: true })
  dimension: string | null;

  @Field(() => String, { nullable: true })
  cdComponent: string | null;

  @Field(() => String, { nullable: true })
  component: string | null;

  @Field(() => String, { nullable: true })
  cdInvestment: string | null;

  @Field(() => String, { nullable: true })
  investment: string | null;

  @Field(() => String, { nullable: true })
  cdInvestmentId: string | null;

  @Field(() => String)
  cdNutsii: string;

  @Field(() => String)
  dsNutsii: string;

  @Field(() => String)
  cdNutsiii: string;

  @Field(() => String)
  dsNutsiii: string;

  @Field(() => String)
  cdMunicipalities: string;

  @Field(() => String)
  dsMunicipalities: string;

  @Field(() => Boolean)
  consortium: boolean;
}

@ObjectType()
export class BeneficiariesSearchOfPRRFilters {
  @Field(() => Float, { nullable: true })
  budgetMax?: number;

  @Field(() => Float, { nullable: true })
  budgetMin?: number;

  @Field(() => Float, { nullable: true })
  paidBudgetMax?: number;

  @Field(() => Float, { nullable: true })
  paidBudgetMin?: number;

  @Field(() => Int, { nullable: true })
  projectsAmountMax?: number;

  @Field(() => Int, { nullable: true })
  projectsAmountMin?: number;
}

@ObjectType()
export class BeneficiariesSearchOfPRR {
  @Field(() => [BeneficiariesSearchOfPRRData])
  data: BeneficiariesSearchOfPRRData[];

  @Field(() => BeneficiariesSearchOfPRRFilters)
  filters: BeneficiariesSearchOfPRRFilters;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalFiltered: number;

  @Field(() => Int)
  total: number;
}

@ObjectType()
export class ProjectsSearchOfPRRData {
  @Field(() => String)
  code: string;

  @Field(() => String)
  description: string;

  @Field(() => Float)
  total: number;

  @Field(() => Float)
  executedValue: number;

  @Field(() => Float)
  grants: number;

  @Field(() => Float)
  loans: number;

  @Field(() => Float, { nullable: true })
  finalScore?: number;

  @Field(() => String, { nullable: true })
  summary?: string;

  @Field(() => Float)
  budget: number;

  @Field(() => String, { nullable: true })
  cdDimension?: string;

  @Field(() => String, { nullable: true })
  dimension?: string;

  @Field(() => String, { nullable: true })
  cdComponent?: string;

  @Field(() => String, { nullable: true })
  component?: string;

  @Field(() => String, { nullable: true })
  cdInvestment?: string;

  @Field(() => String, { nullable: true })
  cdInvestmentId?: string;

  @Field(() => String, { nullable: true })
  investment?: string;

  @Field(() => Date, { nullable: true })
  endDate?: Date;

  @Field(() => String)
  recipientId: string;

  @Field(() => String)
  recipientName: string;

  @Field(() => String, { nullable: true })
  cdNutsii?: string;

  @Field(() => String, { nullable: true })
  dsNutsii?: string;

  @Field(() => String, { nullable: true })
  cdNutsiii?: string;

  @Field(() => String, { nullable: true })
  dsNutsiii?: string;

  @Field(() => String, { nullable: true })
  cdMunicipality?: string;

  @Field(() => String, { nullable: true })
  dsMunicipality?: string;

  @Field(() => Boolean)
  consortium: boolean;

  @Field(() => Boolean)
  fromConsortium: boolean;

  @Field(() => String, { nullable: true })
  benefType?: string;

  @Field(() => Int)
  rank: number;
}

@ObjectType()
export class EuPRRBeneficiaryForm {
  @Field(() => String)
  nif: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  location?: string;

  @Field(() => Int)
  totalProjects: number;

  @Field(() => String, { nullable: true })
  economicActivity?: string;

  @Field(() => Int)
  totalConsortiumParticipations: number;
}

@ObjectType()
export class ProjectsSearchOfPRRFilters {
  @Field(() => Float, { nullable: true })
  budgetMin?: number;

  @Field(() => Float, { nullable: true })
  budgetMax?: number;

  @Field(() => String, { nullable: true })
  endDateMin?: string;

  @Field(() => String, { nullable: true })
  endDateMax?: string;
}

@ObjectType()
export class ProjectsSearchOfPRR {
  @Field(() => [ProjectsSearchOfPRRData])
  data: ProjectsSearchOfPRRData[];

  @Field(() => ProjectsSearchOfPRRFilters)
  filters: ProjectsSearchOfPRRFilters;

  @Field(() => Int)
  totalFiltered: number;

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;
}

@ObjectType()
export class ProjectsTotalsOfPRR {
  @Field(() => Int)
  projects: number;

  @Field(() => Float)
  approvedValue: number;

  @Field(() => Float)
  executedValue: number;

  @Field(() => String, { nullable: true })
  endDateMin?: string;

  @Field(() => String, { nullable: true })
  endDateMax?: string;
}

@ObjectType()
export class ProjectsOfPRRSourceInfo {
  @Field(() => [SourceInfo])
  sourceInfo: SourceInfo[];
}

@ObjectType()
export class BeneficiaryRelatedProject {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => Float, { nullable: true })
  amount?: number;

  @Field(() => Float, { nullable: true })
  paid?: number;

  @Field(() => String, { nullable: true })
  date?: string;
}

@ObjectType()
export class ValueByEntityRole {
  @Field(() => String, { nullable: true })
  entityRole?: string;

  @Field(() => Float, { nullable: true })
  approvedValue?: number;

  @Field(() => Float, { nullable: true })
  executedValue?: number;

  @Field(() => Float, { nullable: true })
  percentageExecutedValue?: number;
}

@ObjectType()
export class BeneficiarySheetOfPRRData {
  @Field(() => String)
  nif: string;

  @Field(() => String)
  name: string;

  @Field(() => Int)
  totalProjects: number;

  @Field(() => Float)
  budget: number;

  @Field(() => String, { nullable: true })
  location?: string;

  @Field(() => String, { nullable: true })
  economicActivity?: string;

  @Field(() => EuPRRBeneficiaryForm, { nullable: true })
  beneficiaryForm?: EuPRRBeneficiaryForm;

  @Field(() => [ValueByEntityRole], { nullable: true })
  valuesByEntityRole?: ValueByEntityRole[];
}

@ObjectType()
export class BeneficiarySheetOfPRR {
  @Field(() => BeneficiarySheetOfPRRData, { nullable: true })
  data?: BeneficiarySheetOfPRRData;
}

@ObjectType()
export class BeneficiaryRelatedProjectsOfPRR {
  @Field(() => String)
  nif: string;

  @Field(() => Int)
  total: number;

  @Field(() => [BeneficiaryRelatedProject], { nullable: true })
  data?: BeneficiaryRelatedProject[];
}

@ObjectType()
export class ProjectFormOfPRR {
  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => Float, { nullable: true })
  totalProjectValue?: number;

  @Field(() => Float, { nullable: true })
  grantFunding?: number;

  @Field(() => Float, { nullable: true })
  loanFunding?: number;

  @Field(() => Float, { nullable: true })
  executedValue?: number;

  @Field(() => String, { nullable: true })
  startDate?: string;

  @Field(() => String, { nullable: true })
  plannedConclusionDate?: string;

  @Field(() => String, { nullable: true })
  dimension?: string;

  @Field(() => String, { nullable: true })
  summary?: string;

  @Field(() => String, { nullable: true })
  component?: string;

  @Field(() => String, { nullable: true })
  investment?: string;
}

@ObjectType()
export class ContractSupplierDetailOfPRR {
  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  value?: string;

  @Field(() => String, { nullable: true })
  link?: string;
}

@ObjectType()
export class ContractDetailOfPRR {
  @Field(() => String, { nullable: true })
  principalDescription?: string;

  @Field(() => Float, { nullable: true })
  contractsValue?: number;

  @Field(() => Int, { nullable: true })
  contractsCount?: number;

  @Field(() => [String], { nullable: true })
  secondaryDescription?: string[];

  @Field(() => [ContractSupplierDetailOfPRR], { nullable: true })
  detailContract?: ContractSupplierDetailOfPRR[];
}

@ObjectType()
export class ProjectContractsOfPRR {
  @Field(() => String, { nullable: true })
  tabName?: string;

  @Field(() => Float, { nullable: true })
  totalContractsValue?: number;

  @Field(() => Int, { nullable: true })
  contractsCount?: number;

  @Field(() => [ContractDetailOfPRR], { nullable: true })
  contractDetails?: ContractDetailOfPRR[];
}

@ObjectType()
export class TabBeneficiaryItemOfPRR {
  @Field(() => String, { nullable: true })
  id?: string;

  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => Float, { nullable: true })
  description?: number;

  @Field(() => Float, { nullable: true })
  paid?: number;
}

@ObjectType()
export class TabBeneficiaryListOfPRR {
  @Field(() => [TabBeneficiaryItemOfPRR], { nullable: true })
  beneficiary?: TabBeneficiaryItemOfPRR[];

  @Field(() => [TabBeneficiaryItemOfPRR], { nullable: true })
  intermediaryBeneficiary?: TabBeneficiaryItemOfPRR[];

  @Field(() => [TabBeneficiaryItemOfPRR], { nullable: true })
  supplier?: TabBeneficiaryItemOfPRR[];

  @Field(() => [TabBeneficiaryItemOfPRR], { nullable: true })
  partner?: TabBeneficiaryItemOfPRR[];
}

@ObjectType()
export class TabBeneficiaryFinancingOfPRR {
  @Field(() => String, { nullable: true })
  tabName?: string;

  @Field(() => TabBeneficiaryListOfPRR, { nullable: true })
  list?: TabBeneficiaryListOfPRR;
}

@ObjectType()
export class ProjectSheetBeneficiaryFinancingOfPRR {
  @Field(() => [TabBeneficiaryItemOfPRR])
  data: TabBeneficiaryItemOfPRR[];

  @Field(() => ProjectSheetBeneficiaryTypeOfPRR)
  beneficiaryType: ProjectSheetBeneficiaryTypeOfPRR;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalFiltered: number;

  @Field(() => Int)
  total: number;
}

@ObjectType()
export class TabGeoDivisionOfPRR {
  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => Float, { nullable: true })
  value?: number;
}

@ObjectType()
export class TabGeoDistributionItemOfPRR {
  @Field(() => String, { nullable: true })
  type?: string;

  @Field(() => [TabGeoDivisionOfPRR], { nullable: true })
  divisions?: TabGeoDivisionOfPRR[];
}

@ObjectType()
export class TabGeoDistributionFinancingOfPRR {
  @Field(() => String, { nullable: true })
  tabName?: string;

  @Field(() => String, { nullable: true })
  source?: string;

  @Field(() => String, { nullable: true })
  sourceLink?: string;

  @Field(() => String, { nullable: true })
  referenceDate?: string;

  @Field(() => Float, { nullable: true })
  valuePercentage?: number;

  @Field(() => [TabGeoDistributionItemOfPRR], { nullable: true })
  distribution?: TabGeoDistributionItemOfPRR[];
}

@ObjectType()
export class TabContestAndContractsOfPRR {
  @Field(() => String, { nullable: true })
  tabName?: string;

  @Field(() => [String], { nullable: true })
  criteria?: string[];

  @Field(() => [ContractDetailOfPRR], { nullable: true })
  contractDetails?: ContractDetailOfPRR[];
}

@ObjectType()
export class TabCandidatureOfPRR {
  @Field(() => String, { nullable: true })
  tabName?: string;

  @Field(() => String, { nullable: true })
  finalScore?: string;

  @Field(() => String, { nullable: true })
  baseScore?: string;

  @Field(() => String, { nullable: true })
  link?: string;
}

@ObjectType()
export class ProjectTabsOfPRR {
  @Field(() => TabGeoDistributionFinancingOfPRR, { nullable: true })
  geoDistributionFinancing?: TabGeoDistributionFinancingOfPRR;

  @Field(() => TabContestAndContractsOfPRR, { nullable: true })
  contestAndContracts?: TabContestAndContractsOfPRR;

  @Field(() => TabCandidatureOfPRR, { nullable: true })
  candidature?: TabCandidatureOfPRR;

  @Field(() => ProjectContractsOfPRR, { nullable: true })
  contracts?: ProjectContractsOfPRR;
}

@ObjectType()
export class ProjectSheetOfPRRData {
  @Field(() => String)
  recipientId: string;

  @Field(() => String)
  recipientName: string;

  @Field(() => String)
  recipientType: string;

  @Field(() => String)
  code: string;

  @Field(() => String)
  description: string;

  @Field(() => Float)
  totalAgg: number;

  @Field(() => Float)
  executed: number;

  @Field(() => Float)
  subventions: number;

  @Field(() => Float)
  loans: number;

  @Field(() => String, { nullable: true })
  endDate?: string;

  @Field(() => String, { nullable: true })
  summary?: string;

  @Field(() => Float)
  total: number;

  @Field(() => String, { nullable: true })
  dimensionCode?: string;

  @Field(() => String, { nullable: true })
  dimension?: string;

  @Field(() => String, { nullable: true })
  componentCode?: string;

  @Field(() => String, { nullable: true })
  component?: string;

  @Field(() => String, { nullable: true })
  investmentCode?: string;

  @Field(() => String, { nullable: true })
  investment?: string;

  @Field(() => Boolean)
  consortium: boolean;

  @Field(() => ProjectFormOfPRR, { nullable: true })
  projectForm?: ProjectFormOfPRR;

  @Field(() => ProjectContractsOfPRR, { nullable: true })
  projectContracts?: ProjectContractsOfPRR;

  @Field(() => ProjectTabsOfPRR, { nullable: true })
  tabs?: ProjectTabsOfPRR;
}

@ObjectType()
export class ProjectSheetOfPRR {
  @Field(() => ProjectSheetOfPRRData, { nullable: true })
  data?: ProjectSheetOfPRRData;
}

@ObjectType()
export class SourceInfoOfPRR {
  @Field(() => [SourceInfo])
  sourceInfo: SourceInfo[];
}

@ObjectType()
export class SourceInfoBeneficiarySheetItem {
  @Field(() => String)
  source: string;

  @Field(() => String)
  sourceLink: string;

  @Field(() => String)
  url: string;

  @Field(() => String, { nullable: true })
  referenceDateProjetos?: string;

  @Field(() => String, { nullable: true })
  referenceDateEntidades?: string;

  @Field(() => String, { nullable: true })
  referenceDateContratos?: string;

  @Field(() => String, { nullable: true })
  referenceDateEntidadesContratos?: string;

  @Field(() => String, { nullable: true })
  referenceDateConsorcio?: string;

  @Field(() => String, { nullable: true })
  modificationDate?: string;

  @Field(() => String, { nullable: true })
  publicationDate?: string;

  @Field(() => String)
  title: string;

  @Field(() => String)
  format: string;
}

@ObjectType()
export class BeneficiarySheetSourceInfoOfPRR {
  @Field(() => [SourceInfoBeneficiarySheetItem])
  sourceInfo: SourceInfoBeneficiarySheetItem[];
}

@ObjectType()
export class BeneficiariesAndProjectsFiltersOfPRR {
  @Field(() => [String], { nullable: true })
  dimensions?: string[];

  @Field(() => [String], { nullable: true })
  components?: string[];

  @Field(() => [String], { nullable: true })
  investments?: string[];

  @Field(() => [String], { nullable: true })
  regions?: string[];

  @Field(() => [String], { nullable: true })
  municipalities?: string[];
}

@ObjectType()
export class SpecificComponentsByDimensionsOfPRR {
  @Field(() => String)
  code: string;

  @Field(() => String)
  shortName: string;
}

@ObjectType()
export class SpecificInvestmentsByComponentsOfPRR {
  @Field(() => String)
  code: string;

  @Field(() => String)
  shortName: string;
}
export interface IBeneficiariesAndProjectsPRRepository {
  searchBeneficiariesOfPRR(
    recipientId?: string,
    recipientName?: string,
    municipality?: string,
    region?: string,
    dimension?: string,
    budgetMin?: number,
    budgetMax?: number,
    paidBudgetMin?: number,
    paidBudgetMax?: number,
    projectsAmountMin?: number,
    projectsAmountMax?: number,
    finalRecipient?: boolean,
    intermediaryRecipient?: boolean,
    supplierRecipient?: boolean,
    partnerRecipient?: boolean,
    page?: number,
    limit?: number,
    sortBy?: BeneficiariesSortByPRR,
    sortOrder?: SortOrder,
  ): Promise<BeneficiariesSearchOfPRR>;
  searchProjectsOfPRR(
    code?: string,
    description?: string,
    dimension?: string,
    dsNutsii?: string,
    municipality?: string,
    budgetMin?: number,
    budgetMax?: number,
    endDateMin?: Date,
    endDateMax?: Date,
    page?: number,
    limit?: number,
    sortBy?: ProjectsSortByPRR,
    sortOrder?: SortOrder,
  ): Promise<ProjectsSearchOfPRR>;
  getProjectsOfPRRSourceInfo(): Promise<ProjectsOfPRRSourceInfo>;
  getProjectsTotalsOfPRR(): Promise<ProjectsTotalsOfPRR>;
  getBeneficiarySheetOfPRR(nif: string): Promise<BeneficiarySheetOfPRR>;
  getBeneficiaryRelatedProjectsOfPRR(
    nif: string,
    projectType: BeneficiaryProjectType,
    page?: number,
    limit?: number,
  ): Promise<BeneficiaryRelatedProjectsOfPRR>;
  getProjectSheetOfPRR(recipientId?: string): Promise<ProjectSheetOfPRR>;
  getProjectSheetBeneficiaryFinancingOfPRR(
    recipientId?: string,
    beneficiaryType?: ProjectSheetBeneficiaryTypeOfPRR,
    page?: number,
    limit?: number,
  ): Promise<ProjectSheetBeneficiaryFinancingOfPRR>;
  getBeneficiarySourceInfoOfPRR(): Promise<SourceInfoOfPRR>;
  getBeneficiarySheetSourceInfoOfPRR(): Promise<BeneficiarySheetSourceInfoOfPRR>;
  getBeneficiariesAndProjectsFiltersOfPRR(): Promise<BeneficiariesAndProjectsFiltersOfPRR>;
  getSpecificComponentsByDimensionsOfPRR(
    dsStructuralDimension?: string,
  ): Promise<SpecificComponentsByDimensionsOfPRR[]>;
  getSpecificInvestmentsByComponentsOfPRR(
    dsComponent?: string,
  ): Promise<SpecificInvestmentsByComponentsOfPRR[]>;
}
