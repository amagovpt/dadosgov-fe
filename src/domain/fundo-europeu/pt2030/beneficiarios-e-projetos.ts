import { SourceInfo } from '@/@types/shared-types';
import { ObjectType, Field, Float, Int, registerEnumType } from 'type-graphql';

// Enum for entity roles
export enum EntityRole {
  BENEFICIARIO_PRINCIPAL = 'Beneficiário Principal',
  OUTROS_BENEFICIARIOS = 'Outros Beneficiários',
  FORNECEDOR = 'Fornecedor',
}

registerEnumType(EntityRole, {
  name: 'EntityRole',
  description: 'Role of the entity in Portugal 2030',
});

// Enums for sorting
export enum BeneficiarySortBy {
  APPROVED_VALUE = 'approvedValue',
  EXECUTED_VALUE = 'executedValue',
  PAID_VALUE = 'paidValue',
  PROJECTS_AMOUNT = 'projectsAmount',
}

export enum ProjectSortBy {
  APPROVED_VALUE = 'approvedValue',
  EXECUTED_VALUE = 'executedValue',
  PAID_VALUE = 'paidValue',
  PLANNED_CONCLUSION_DATE = 'plannedConclusionDate',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum BeneficiaryType {
  MAIN = 'MAIN',
  OTHER = 'OTHER',
}

registerEnumType(BeneficiarySortBy, {
  name: 'BeneficiarySortBy',
  description: 'Fields available for sorting beneficiaries',
});

registerEnumType(ProjectSortBy, {
  name: 'ProjectSortBy',
  description: 'Fields available for sorting projects',
});

registerEnumType(SortOrder, {
  name: 'SortOrder',
  description: 'Sort order direction',
});

registerEnumType(BeneficiaryType, {
  name: 'BeneficiaryType',
  description: 'Type of beneficiary to retrieve: main, other, or all',
});

@ObjectType()
export class FilterDetails {
  @Field(() => Float)
  approvedValueMin: number;

  @Field(() => Float)
  approvedValueMax: number;

  @Field(() => Float)
  executedValueMin: number;

  @Field(() => Float)
  executedValueMax: number;

  @Field(() => Float, { nullable: true })
  paidValueMin?: number;

  @Field(() => Float, { nullable: true })
  paidValueMax?: number;

  @Field(() => Int, { nullable: true })
  projectsAmountMin?: number;

  @Field(() => Int, { nullable: true })
  projectsAmountMax?: number;

  @Field(() => String, { nullable: true })
  plannedConclusionDateMin?: string;

  @Field(() => String, { nullable: true })
  plannedConclusionDateMax?: string;
}

@ObjectType()
export class BeneficiariesAndProjectsOfPortugal2030SourceInfo {
  @Field(() => [SourceInfo])
  sourceInfo: SourceInfo[];
}

// Beneficiary Filters Portugal 2030
@ObjectType()
export class BeneficiariesAndProjectsFiltersOfPortugal2030 {
  @Field(() => [String])
  funds: string[];

  @Field(() => [String])
  policyObjectives: string[];

  @Field(() => [String])
  programmes: string[];

  @Field(() => [String])
  thematicAreas: string[];

  @Field(() => [String])
  specificObjectives: string[];

  @Field(() => [String])
  regions: string[];

  @Field(() => [String])
  municipalities: string[];
}

// Specific Objectives Portugal 2030
@ObjectType()
export class SpecificObjectiveData {
  @Field(() => String)
  code: string;

  @Field(() => String)
  shortName: string;
}

@ObjectType()
export class SpecificObjectivesOfPortugal2030 {
  @Field(() => [SpecificObjectiveData])
  data: SpecificObjectiveData[];
}

// Beneficiaries of Portugal 2030
@ObjectType()
export class BeneficiaryOfPortugal2030Data {
  @Field(() => String)
  entityName: string;

  @Field(() => String)
  entityNif: string;

  @Field(() => String)
  entityRole: string;

  @Field(() => Float)
  approvedValue: number;

  @Field(() => Float)
  executedValue: number;

  @Field(() => Float, { nullable: true })
  paidValue?: number;

  @Field(() => Int)
  projectsAmount: number;
}

@ObjectType()
export class BeneficiariesOfPortugal2030 {
  @Field(() => [BeneficiaryOfPortugal2030Data])
  data: BeneficiaryOfPortugal2030Data[];

  @Field(() => FilterDetails)
  filters: FilterDetails;

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  totalFiltered: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;
}

// Beneficiary Sheet of Portugal 2030
@ObjectType()
export class ValuesByEntityRole {
  @Field(() => String)
  entityRole: string;

  @Field(() => Float)
  approvedValue: number;

  @Field(() => Float)
  executedValue: number;

  @Field(() => Float)
  paidValue: number;

  @Field(() => Float)
  percentageExecutedValue: number;
}

@ObjectType()
export class BeneficiarySheet {
  @Field(() => String)
  entityName: string;

  @Field(() => String)
  entityNif: string;

  @Field(() => Float)
  approvedValue: number;

  @Field(() => Int)
  projectsAmount: number;

  @Field(() => Float)
  paidValue: number;
}

@ObjectType()
export class ProjectsByBeneficiary {
  @Field(() => String)
  operationCode: string;

  @Field(() => String)
  operationName: string;

  @Field(() => Float)
  approvedValue: number;

  @Field(() => String, { nullable: true })
  effectiveConclusionDate: string;
}

@ObjectType()
export class NumberOfProjectsByEntityRole {
  @Field(() => String)
  entityRole: string;

  @Field(() => Int)
  projectsAmount: number;
}

@ObjectType()
export class BeneficiarySheetOfPortugal2030Data {
  @Field(() => String)
  entityName: string;

  @Field(() => String)
  entityNif: string;

  @Field(() => Float)
  approvedValue: number;

  @Field(() => Float)
  paidValue: number;

  @Field(() => [ValuesByEntityRole])
  valuesByEntityRole: ValuesByEntityRole[];

  // @Field(() => [SuppliersInDetail], { nullable: true })
  // suppliersInDetail: SuppliersInDetail[];

  @Field(() => [BeneficiarySheet])
  beneficiarySheet: BeneficiarySheet[];

  @Field(() => [NumberOfProjectsByEntityRole])
  numberOfProjectsByEntityRole: NumberOfProjectsByEntityRole[];
}

@ObjectType()
export class BeneficiarySheetOfPortugal2030 {
  @Field(() => BeneficiarySheetOfPortugal2030Data, { nullable: true })
  data: BeneficiarySheetOfPortugal2030Data;

  @Field(() => [SourceInfo])
  sourceInfo: SourceInfo[];
}

@ObjectType()
export class ProjectsByBeneficiarySheetOfPortugal2030 {
  @Field(() => [ProjectsByBeneficiary], { nullable: true })
  data: ProjectsByBeneficiary[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;
}

@ObjectType()
export class BeneficiariesByProjectSheetOfPortugal2030 {
  @Field(() => [Beneficiary])
  data: Beneficiary[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;
}

// Projects of Portugal 2030
@ObjectType()
export class ProjectOfPortugal2030Data {
  @Field(() => String)
  operationCode: string;

  @Field(() => String)
  operationName: string;

  @Field(() => String)
  programmeCode: string;

  @Field(() => String)
  programmeName: string;

  @Field(() => String)
  policyObjectiveCode: string;

  @Field(() => String)
  policyObjectiveName: string;

  @Field(() => String)
  specificObjectiveCode: string;

  @Field(() => String)
  specificObjectiveShortName: string;

  @Field(() => String)
  thematicAreaCode: string;

  @Field(() => String)
  thematicAreaName: string;

  @Field(() => String)
  fundCode: string;

  @Field(() => String)
  fundName: string;

  @Field(() => Float)
  approvedValue: number;

  @Field(() => Float)
  executedValue: number;

  @Field(() => Float, { nullable: true })
  paidValue?: number;

  @Field(() => String, { nullable: true })
  effectiveConclusionDate: string;

  @Field(() => String, { nullable: true })
  plannedConclusionDate: string;

  @Field(() => String)
  nutsiiOperationCode: string;

  @Field(() => String)
  nutsiiOperationName: string;

  @Field(() => String)
  nutsiiiOperationCode: string;

  @Field(() => String)
  nutsiiiOperationName: string;

  @Field(() => String)
  municipalityOperationCode: string;

  @Field(() => String)
  municipalityOperationName: string;
}

@ObjectType()
export class ProjectOfPortugal2030 {
  @Field(() => [ProjectOfPortugal2030Data])
  data: ProjectOfPortugal2030Data[];

  @Field(() => FilterDetails)
  filters: FilterDetails;

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  totalFiltered: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;
}

// Project Sheet of Portugal 2030
@ObjectType()
export class Candidaturas {
  @Field(() => String)
  tab_nome: string;

  @Field(() => String, { nullable: true })
  nota_final?: string;

  @Field(() => String)
  codigo_aviso: string;

  @Field(() => String)
  designacao_aviso: string;
}

@ObjectType()
export class Beneficiary {
  @Field(() => String)
  name: string;

  @Field(() => String)
  entityNif: string;

  @Field(() => Float)
  financingAmount: number;
}

@ObjectType()
export class InfoDatasetItem {
  @Field(() => String)
  url: string;

  @Field(() => String)
  title: string;

  @Field(() => String)
  format: string;

  @Field(() => String)
  publication_date: string;

  @Field(() => String)
  modification_date: string;
}

@ObjectType()
export class InfoDataset {
  @Field(() => [InfoDatasetItem])
  info: InfoDatasetItem[];

  @Field(() => String)
  source: string;

  @Field(() => String)
  source_link: string;

  @Field(() => String)
  reference_date: string;
}

@ObjectType()
export class DistribuicaoItem {
  @Field(() => String)
  descricao: string;

  @Field(() => Float)
  valor_financiamento: number;

  @Field(() => Float, { nullable: true })
  valor_pago?: number;
}

@ObjectType()
export class DistribuicaoGeografica {
  @Field(() => String)
  tipo: string;

  @Field(() => Int, { nullable: true })
  order?: number;

  @Field(() => [DistribuicaoItem], { nullable: true })
  distribuicao?: DistribuicaoItem[];

  @Field(() => Float, { nullable: true })
  pc_valor_executado?: number;

  @Field(() => String, { nullable: true })
  distribuicao_indefinida?: string;

  @Field(() => String, { nullable: true })
  valor_financiamento_total?: string;
}

@ObjectType()
export class ProjectSheetOfPortugal2030 {
  @Field(() => String, { nullable: true })
  nome?: string;

  @Field(() => String, { nullable: true })
  sumario?: string;

  @Field(() => String, { nullable: true })
  modalidade?: string;

  @Field(() => Candidaturas, { nullable: true })
  candidaturas?: Candidaturas;

  @Field(() => [String], { nullable: true })
  fornecedores?: string[];

  @Field(() => [InfoDataset], { nullable: true })
  info_datasets?: InfoDataset[];

  @Field(() => String, { nullable: true })
  codigo_projeto?: string;

  @Field(() => String, { nullable: true })
  valor_executado?: string;

  @Field(() => String, { nullable: true })
  valor_pago?: string;

  @Field(() => String, { nullable: true })
  dt_inicio_efetiva?: string;

  @Field(() => String, { nullable: true })
  dt_inicio_prevista?: string;

  @Field(() => String, { nullable: true })
  objetivo_especifico?: string;

  @Field(() => String, { nullable: true })
  valor_financiamento?: string;

  @Field(() => String, { nullable: true })
  dt_conclusao_efetiva?: string;

  @Field(() => String, { nullable: true })
  objetivo_estrategico?: string;

  @Field(() => String, { nullable: true })
  dt_conclusao_prevista?: string;

  @Field(() => [DistribuicaoGeografica], { nullable: true })
  distribuicao_geografica?: DistribuicaoGeografica[];
}

export interface IBeneficiariesAndProjectsRepository {
  // Beneficiaries
  searchBeneficiariesOfPortugal2030(
    name?: string,
    nif?: string,
    page?: number,
    limit?: number,
    fund?: string,
    policyObjective?: string,
    specificObjective?: string,
    programme?: string,
    thematicArea?: string,
    region?: string,
    municipality?: string,
    entityRoles?: EntityRole[],
    projectsAmountMin?: number,
    projectsAmountMax?: number,
    approvedValueMin?: number,
    approvedValueMax?: number,
    executedValueMin?: number,
    executedValueMax?: number,
    paidValueMin?: number,
    paidValueMax?: number,
    sortBy?: BeneficiarySortBy,
    sortOrder?: SortOrder,
  ): Promise<BeneficiariesOfPortugal2030>;
  getBeneficiariesAndProjectsFiltersOfPortugal2030(): Promise<BeneficiariesAndProjectsFiltersOfPortugal2030>;
  // Beneficiary Sheet
  getBeneficiarySheetOfPortugal2030(
    nif: string,
  ): Promise<BeneficiarySheetOfPortugal2030>;
  getProjectsByBeneficiarySheetOfPortugal2030(
    nif: string,
    entityRole: EntityRole,
    page?: number,
    limit?: number,
  ): Promise<ProjectsByBeneficiarySheetOfPortugal2030>;
  getBeneficiariesByProjectSheetOfPortugal2030(
    projectCode: string,
    beneficiaryType?: BeneficiaryType,
    page?: number,
    limit?: number,
  ): Promise<BeneficiariesByProjectSheetOfPortugal2030>;
  // Projects
  searchProjectsOfPortugal2030(
    page?: number,
    limit?: number,
    operationName?: string,
    operationCode?: string,
    fund?: string,
    policyObjective?: string,
    programme?: string,
    thematicArea?: string,
    region?: string,
    municipality?: string,
    specificObjectiveShortName?: string,
    approvedValueMin?: number,
    approvedValueMax?: number,
    executedValueMin?: number,
    executedValueMax?: number,
    paidValueMin?: number,
    paidValueMax?: number,
    plannedConclusionDateMin?: string,
    plannedConclusionDateMax?: string,
    sortBy?: ProjectSortBy,
    sortOrder?: SortOrder,
  ): Promise<ProjectOfPortugal2030>;
  getBeneficiariesAndProjectsFiltersOfPortugal2030(): Promise<BeneficiariesAndProjectsFiltersOfPortugal2030>;
  getSpecificObjectivesByPolicyObjectiveOfPortugal2030(
    policyObjective?: string,
  ): Promise<SpecificObjectivesOfPortugal2030>;
  getBeneficiariesOfPortugal2030SourceInfo(): Promise<BeneficiariesAndProjectsOfPortugal2030SourceInfo>;
  getProjectsOfPortugal2030SourceInfo(): Promise<BeneficiariesAndProjectsOfPortugal2030SourceInfo>;
  // Project Sheet
  getProjectSheetOfPortugal2030(
    codigoProjeto?: string,
  ): Promise<ProjectSheetOfPortugal2030>;
}
