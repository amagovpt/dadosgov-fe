import {
  BeneficiariesOfPortugal2030,
  BeneficiariesAndProjectsFiltersOfPortugal2030,
  SpecificObjectivesOfPortugal2030,
  ProjectOfPortugal2030,
  BeneficiariesAndProjectsOfPortugal2030SourceInfo,
  BeneficiarySortBy,
  ProjectSortBy,
  IBeneficiariesAndProjectsRepository,
  SortOrder,
  BeneficiarySheetOfPortugal2030,
  ProjectsByBeneficiarySheetOfPortugal2030,
  BeneficiariesByProjectSheetOfPortugal2030,
  EntityRole,
  ProjectSheetOfPortugal2030,
  BeneficiaryType,
} from '@domain/fundo-europeu/pt2030/beneficiarios-e-projetos';
import { BeneficiariesAndProjectsRepository } from '@infrastructure/Repository/fundo-europeu/pt2030/beneficiarios-e-projetos.repository';



export class BeneficiariesAndProjectsUseCase {
  private readonly beneficiariesAndProjectsRepo: IBeneficiariesAndProjectsRepository;

  constructor() {
    this.beneficiariesAndProjectsRepo =
      new BeneficiariesAndProjectsRepository();
  }

  async searchBeneficiariesOfPortugal2030(
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
  ): Promise<BeneficiariesOfPortugal2030> {
    const beneficiariesAndProjects =
      await this.beneficiariesAndProjectsRepo.searchBeneficiariesOfPortugal2030(
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
    return beneficiariesAndProjects;
  }

  async getBeneficiariesAndProjectsFiltersOfPortugal2030(): Promise<BeneficiariesAndProjectsFiltersOfPortugal2030> {
    const beneficiariesAndProjectsFilters =
      await this.beneficiariesAndProjectsRepo.getBeneficiariesAndProjectsFiltersOfPortugal2030();
    return beneficiariesAndProjectsFilters;
  }

  async getSpecificObjectivesByPolicyObjectiveOfPortugal2030(
    policyObjective?: string,
  ): Promise<SpecificObjectivesOfPortugal2030> {
    const specificObjectives =
      await this.beneficiariesAndProjectsRepo.getSpecificObjectivesByPolicyObjectiveOfPortugal2030(
        policyObjective,
      );
    return specificObjectives;
  }

  async getBeneficiarySheetOfPortugal2030(
    nif: string,
  ): Promise<BeneficiarySheetOfPortugal2030> {
    const beneficiarySheet =
      await this.beneficiariesAndProjectsRepo.getBeneficiarySheetOfPortugal2030(
        nif,
      );
    return beneficiarySheet;
  }

  async getProjectsByBeneficiarySheetOfPortugal2030(
    nif: string,
    entityRole: EntityRole,
    page?: number,
    limit?: number,
  ): Promise<ProjectsByBeneficiarySheetOfPortugal2030> {
    return this.beneficiariesAndProjectsRepo.getProjectsByBeneficiarySheetOfPortugal2030(
      nif,
      entityRole,
      page,
      limit,
    );
  }

  async getBeneficiariesByProjectSheetOfPortugal2030(
    projectCode: string,
    beneficiaryType?: BeneficiaryType,
    page?: number,
    limit?: number,
  ): Promise<BeneficiariesByProjectSheetOfPortugal2030> {
    return this.beneficiariesAndProjectsRepo.getBeneficiariesByProjectSheetOfPortugal2030(
      projectCode,
      beneficiaryType || BeneficiaryType.MAIN,
      page,
      limit,
    );
  }

  async searchProjectsOfPortugal2030(
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
  ): Promise<ProjectOfPortugal2030> {
    const projectsOfPortugal2030 =
      await this.beneficiariesAndProjectsRepo.searchProjectsOfPortugal2030(
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
    return projectsOfPortugal2030;
  }

  async getBeneficiariesOfPortugal2030SourceInfo(): Promise<BeneficiariesAndProjectsOfPortugal2030SourceInfo> {
    const sourceInfo =
      await this.beneficiariesAndProjectsRepo.getBeneficiariesOfPortugal2030SourceInfo();
    return sourceInfo;
  }

  async getProjectsOfPortugal2030SourceInfo(): Promise<BeneficiariesAndProjectsOfPortugal2030SourceInfo> {
    const sourceInfo =
      await this.beneficiariesAndProjectsRepo.getProjectsOfPortugal2030SourceInfo();
    return sourceInfo;
  }

  async getProjectSheetOfPortugal2030(
    codigoProjeto?: string,
  ): Promise<ProjectSheetOfPortugal2030> {
    return this.beneficiariesAndProjectsRepo.getProjectSheetOfPortugal2030(
      codigoProjeto,
    );
  }
}
