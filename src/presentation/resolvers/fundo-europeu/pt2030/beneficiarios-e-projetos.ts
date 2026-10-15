import {
  BeneficiariesOfPortugal2030,
  BeneficiariesAndProjectsFiltersOfPortugal2030,
  SpecificObjectivesOfPortugal2030,
  ProjectOfPortugal2030,
  BeneficiariesAndProjectsOfPortugal2030SourceInfo,
  BeneficiarySortBy,
  ProjectSortBy,
  SortOrder,
  BeneficiarySheetOfPortugal2030,
  ProjectsByBeneficiarySheetOfPortugal2030,
  BeneficiariesByProjectSheetOfPortugal2030,
  EntityRole,
  ProjectSheetOfPortugal2030,
  BeneficiaryType,
} from '@domain/fundo-europeu/pt2030/beneficiarios-e-projetos';
import { BeneficiariesAndProjectsUseCase } from '@useCases/fundo-europeu/pt2030.use-case';
import { Arg, Float, Int, Query, Resolver } from 'type-graphql';

@Resolver()
export class BeneficiariesAndProjectsResolver {
  private readonly beneficiariesAndProjectsUseCase: BeneficiariesAndProjectsUseCase;

  constructor() {
    this.beneficiariesAndProjectsUseCase =
      new BeneficiariesAndProjectsUseCase();
  }

  @Query(() => BeneficiariesOfPortugal2030)
  async searchBeneficiariesOfPortugal2030(
    @Arg('name', () => String, { nullable: true }) name?: string,
    @Arg('nif', () => String, { nullable: true }) nif?: string,
    @Arg('page', () => Int, { nullable: true, defaultValue: 1 }) page?: number,
    @Arg('limit', () => Int, { nullable: true, defaultValue: 50 })
    limit?: number,
    @Arg('fund', () => String, { nullable: true }) fund?: string,
    @Arg('policyObjective', () => String, { nullable: true })
    policyObjective?: string,
    @Arg('specificObjective', () => String, { nullable: true })
    specificObjective?: string,
    @Arg('programme', () => String, { nullable: true })
    programme?: string,
    @Arg('thematicArea', () => String, { nullable: true })
    thematicArea?: string,
    @Arg('region', () => String, { nullable: true }) region?: string,
    @Arg('municipality', () => String, { nullable: true })
    municipality?: string,
    @Arg('entityRoles', () => [EntityRole], { nullable: true })
    entityRoles?: EntityRole[],
    @Arg('projectsAmountMin', () => Int, { nullable: true })
    projectsAmountMin?: number,
    @Arg('projectsAmountMax', () => Int, { nullable: true })
    projectsAmountMax?: number,
    @Arg('approvedValueMin', () => Float, { nullable: true })
    approvedValueMin?: number,
    @Arg('approvedValueMax', () => Float, { nullable: true })
    approvedValueMax?: number,
    @Arg('executedValueMin', () => Float, { nullable: true })
    executedValueMin?: number,
    @Arg('executedValueMax', () => Float, { nullable: true })
    executedValueMax?: number,
    @Arg('paidValueMin', () => Float, { nullable: true })
    paidValueMin?: number,
    @Arg('paidValueMax', () => Float, { nullable: true })
    paidValueMax?: number,
    @Arg('sortBy', () => BeneficiarySortBy, {
      nullable: true,
      defaultValue: BeneficiarySortBy.APPROVED_VALUE,
    })
    sortBy?: BeneficiarySortBy,
    @Arg('sortOrder', () => SortOrder, {
      nullable: true,
      defaultValue: SortOrder.DESC,
    })
    sortOrder?: SortOrder,
  ): Promise<BeneficiariesOfPortugal2030> {
    return this.beneficiariesAndProjectsUseCase.searchBeneficiariesOfPortugal2030(
      name,
      nif,
      page,
      limit,
      fund,
      policyObjective,
      specificObjective,
      programme,
      thematicArea,
      region,
      municipality,
      entityRoles,
      projectsAmountMin,
      projectsAmountMax,
      approvedValueMin,
      approvedValueMax,
      executedValueMin,
      executedValueMax,
      paidValueMin,
      paidValueMax,
      sortBy,
      sortOrder,
    );
  }

  @Query(() => BeneficiariesAndProjectsFiltersOfPortugal2030)
  async queryBeneficiariesAndProjectsFiltersOfPortugal2030(): Promise<BeneficiariesAndProjectsFiltersOfPortugal2030> {
    return this.beneficiariesAndProjectsUseCase.getBeneficiariesAndProjectsFiltersOfPortugal2030();
  }

  @Query(() => SpecificObjectivesOfPortugal2030)
  async querySpecificObjectivesByPolicyObjectiveOfPortugal2030(
    @Arg('policyObjective', () => String, { nullable: true })
    policyObjective?: string,
  ): Promise<SpecificObjectivesOfPortugal2030> {
    return this.beneficiariesAndProjectsUseCase.getSpecificObjectivesByPolicyObjectiveOfPortugal2030(
      policyObjective,
    );
  }

  @Query(() => ProjectOfPortugal2030)
  async searchProjectsOfPortugal2030(
    @Arg('page', () => Int, { nullable: true, defaultValue: 1 }) page?: number,
    @Arg('limit', () => Int, { nullable: true, defaultValue: 50 })
    limit?: number,
    @Arg('operationName', () => String, { nullable: true })
    operationName?: string,
    @Arg('operationCode', () => String, { nullable: true })
    operationCode?: string,
    @Arg('fund', () => String, { nullable: true }) fund?: string,
    @Arg('policyObjective', () => String, { nullable: true })
    policyObjective?: string,
    @Arg('programme', () => String, { nullable: true })
    programme?: string,
    @Arg('thematicArea', () => String, { nullable: true })
    thematicArea?: string,
    @Arg('region', () => String, { nullable: true }) region?: string,
    @Arg('municipality', () => String, { nullable: true })
    municipality?: string,
    @Arg('specificObjectiveShortName', () => String, { nullable: true })
    specificObjectiveShortName?: string,
    @Arg('approvedValueMin', () => Float, { nullable: true })
    approvedValueMin?: number,
    @Arg('approvedValueMax', () => Float, { nullable: true })
    approvedValueMax?: number,
    @Arg('executedValueMin', () => Float, { nullable: true })
    executedValueMin?: number,
    @Arg('executedValueMax', () => Float, { nullable: true })
    executedValueMax?: number,
    @Arg('paidValueMin', () => Float, { nullable: true })
    paidValueMin?: number,
    @Arg('paidValueMax', () => Float, { nullable: true })
    paidValueMax?: number,
    @Arg('plannedConclusionDateMin', () => String, { nullable: true })
    plannedConclusionDateMin?: string,
    @Arg('plannedConclusionDateMax', () => String, { nullable: true })
    plannedConclusionDateMax?: string,
    @Arg('sortBy', () => ProjectSortBy, {
      nullable: true,
      defaultValue: ProjectSortBy.APPROVED_VALUE,
    })
    sortBy?: ProjectSortBy,
    @Arg('sortOrder', () => SortOrder, {
      nullable: true,
      defaultValue: SortOrder.DESC,
    })
    sortOrder?: SortOrder,
  ): Promise<ProjectOfPortugal2030> {
    return this.beneficiariesAndProjectsUseCase.searchProjectsOfPortugal2030(
      page,
      limit,
      operationName,
      operationCode,
      fund,
      policyObjective,
      programme,
      thematicArea,
      region,
      municipality,
      specificObjectiveShortName,
      approvedValueMin,
      approvedValueMax,
      executedValueMin,
      executedValueMax,
      paidValueMin,
      paidValueMax,
      plannedConclusionDateMin,
      plannedConclusionDateMax,
      sortBy,
      sortOrder,
    );
  }

  @Query(() => BeneficiariesAndProjectsOfPortugal2030SourceInfo)
  async queryBeneficiariesOfPortugal2030SourceInfo(): Promise<BeneficiariesAndProjectsOfPortugal2030SourceInfo> {
    return this.beneficiariesAndProjectsUseCase.getBeneficiariesOfPortugal2030SourceInfo();
  }

  @Query(() => BeneficiariesAndProjectsOfPortugal2030SourceInfo)
  async queryProjectsOfPortugal2030SourceInfo(): Promise<BeneficiariesAndProjectsOfPortugal2030SourceInfo> {
    return this.beneficiariesAndProjectsUseCase.getProjectsOfPortugal2030SourceInfo();
  }

  @Query(() => BeneficiarySheetOfPortugal2030)
  async queryBeneficiarySheetOfPortugal2030(
    @Arg('nif', () => String) nif: string,
  ): Promise<BeneficiarySheetOfPortugal2030> {
    return this.beneficiariesAndProjectsUseCase.getBeneficiarySheetOfPortugal2030(
      nif,
    );
  }

  @Query(() => ProjectsByBeneficiarySheetOfPortugal2030)
  async queryProjectsByBeneficiarySheetOfPortugal2030(
    @Arg('nif', () => String) nif: string,
    @Arg('entityRole', () => EntityRole) entityRole: EntityRole,
    @Arg('page', () => Int, { nullable: true, defaultValue: 1 }) page?: number,
    @Arg('limit', () => Int, { nullable: true, defaultValue: 5 })
    limit?: number,
  ): Promise<ProjectsByBeneficiarySheetOfPortugal2030> {
    return this.beneficiariesAndProjectsUseCase.getProjectsByBeneficiarySheetOfPortugal2030(
      nif,
      entityRole,
      page,
      limit,
    );
  }

  @Query(() => BeneficiariesByProjectSheetOfPortugal2030)
  async queryBeneficiariesByProjectSheetOfPortugal2030(
    @Arg('projectCode', () => String) projectCode: string,
    @Arg('beneficiaryType', () => BeneficiaryType, {
      nullable: true,
      defaultValue: BeneficiaryType.MAIN,
    })
    beneficiaryType?: BeneficiaryType,
    @Arg('page', () => Int, { nullable: true, defaultValue: 1 }) page?: number,
    @Arg('limit', () => Int, { nullable: true, defaultValue: 5 })
    limit?: number,
  ): Promise<BeneficiariesByProjectSheetOfPortugal2030> {
    return this.beneficiariesAndProjectsUseCase.getBeneficiariesByProjectSheetOfPortugal2030(
      projectCode,
      beneficiaryType,
      page,
      limit,
    );
  }

  @Query(() => ProjectSheetOfPortugal2030)
  async queryProjectSheetOfPortugal2030(
    @Arg('codigoProjeto', () => String) codigoProjeto: string,
  ): Promise<ProjectSheetOfPortugal2030> {
    return this.beneficiariesAndProjectsUseCase.getProjectSheetOfPortugal2030(
      codigoProjeto,
    );
  }
}
