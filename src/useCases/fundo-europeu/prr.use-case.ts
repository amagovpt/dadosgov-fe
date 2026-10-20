import {
  BeneficiariesSearchOfPRR,
  IBeneficiariesAndProjectsPRRepository,
  BeneficiariesSortByPRR,
  SortOrder,
  BeneficiarySheetOfPRR,
  ProjectSheetOfPRR,
  ProjectsSearchOfPRR,
  ProjectsOfPRRSourceInfo,
  ProjectsTotalsOfPRR,
  ProjectSheetBeneficiaryFinancingOfPRR,
  ProjectSheetBeneficiaryTypeOfPRR,
  BeneficiaryProjectType,
  BeneficiaryRelatedProjectsOfPRR,
  ProjectsSortByPRR,
  SourceInfoOfPRR,
  BeneficiarySheetSourceInfoOfPRR,
  BeneficiariesAndProjectsFiltersOfPRR,
  SpecificComponentsByDimensionsOfPRR,
  SpecificInvestmentsByComponentsOfPRR,
} from '@domain/fundo-europeu/prr/beneficiarios-e-projetos';
import { BeneficiariesAndProjectsPRRepository } from '@infrastructure/Repository/fundo-europeu/prr/beneficiarios-e-projetos.repository';

export class BeneficiariesAndProjectsPRRUseCase {
  private readonly beneficiariesAndProjectsPRRRepo: IBeneficiariesAndProjectsPRRepository;

  constructor() {
    this.beneficiariesAndProjectsPRRRepo =
      new BeneficiariesAndProjectsPRRepository();
  }

  async searchBeneficiariesOfPRRUseCase(
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
    finalRecipient: boolean = true,
    intermediaryRecipient: boolean = true,
    supplierRecipient: boolean = true,
    partnerRecipient: boolean = true,
    page?: number,
    limit?: number,
    sortBy?: BeneficiariesSortByPRR,
    sortOrder?: SortOrder,
  ): Promise<BeneficiariesSearchOfPRR> {
    return this.beneficiariesAndProjectsPRRRepo.searchBeneficiariesOfPRR(
      recipientId,
      recipientName,
      municipality,
      region,
      dimension,
      budgetMin,
      budgetMax,
      paidBudgetMin,
      paidBudgetMax,
      projectsAmountMin,
      projectsAmountMax,
      finalRecipient,
      intermediaryRecipient,
      supplierRecipient,
      partnerRecipient,
      page,
      limit,
      sortBy,
      sortOrder,
    );
  }

  async getBeneficiarySheetOfPRR(nif: string): Promise<BeneficiarySheetOfPRR> {
    return this.beneficiariesAndProjectsPRRRepo.getBeneficiarySheetOfPRR(nif);
  }

  async getBeneficiaryRelatedProjectsOfPRR(
    nif: string,
    projectType: BeneficiaryProjectType,
    page: number = 1,
    limit: number = 5,
  ): Promise<BeneficiaryRelatedProjectsOfPRR> {
    return this.beneficiariesAndProjectsPRRRepo.getBeneficiaryRelatedProjectsOfPRR(
      nif,
      projectType,
      page,
      limit,
    );
  }

  async getProjectSheetOfPRR(recipientId?: string): Promise<ProjectSheetOfPRR> {
    return this.beneficiariesAndProjectsPRRRepo.getProjectSheetOfPRR(
      recipientId,
    );
  }

  async getProjectSheetBeneficiaryFinancingOfPRR(
    projectCode?: string,
    beneficiaryType: ProjectSheetBeneficiaryTypeOfPRR = ProjectSheetBeneficiaryTypeOfPRR.BENEFICIARY,
    page: number = 1,
    limit: number = 10,
  ): Promise<ProjectSheetBeneficiaryFinancingOfPRR> {
    return this.beneficiariesAndProjectsPRRRepo.getProjectSheetBeneficiaryFinancingOfPRR(
      projectCode,
      beneficiaryType,
      page,
      limit,
    );
  }

  async searchProjectsOfPRRUseCase(
    code?: string,
    description?: string,
    dimension?: string,
    dsNutsii?: string,
    municipality?: string,
    budgetMin?: number,
    budgetMax?: number,
    endDateMin?: Date,
    endDateMax?: Date,
    page: number = 1,
    limit: number = 10,
    sortBy: ProjectsSortByPRR = ProjectsSortByPRR.BUDGET,
    sortOrder: SortOrder = SortOrder.ASC,
  ): Promise<ProjectsSearchOfPRR> {
    return this.beneficiariesAndProjectsPRRRepo.searchProjectsOfPRR(
      code,
      description,
      dimension,
      dsNutsii,
      municipality,
      budgetMin,
      budgetMax,
      endDateMin,
      endDateMax,
      page,
      limit,
      sortBy,
      sortOrder,
    );
  }

  async getProjectsOfPRRSourceInfoUseCase(): Promise<ProjectsOfPRRSourceInfo> {
    return this.beneficiariesAndProjectsPRRRepo.getProjectsOfPRRSourceInfo();
  }

  async getProjectsTotalsOfPRRUseCase(): Promise<ProjectsTotalsOfPRR> {
    return this.beneficiariesAndProjectsPRRRepo.getProjectsTotalsOfPRR();
  }

  async getBeneficiarySourceInfoOfPRR(): Promise<SourceInfoOfPRR> {
    return this.beneficiariesAndProjectsPRRRepo.getBeneficiarySourceInfoOfPRR();
  }

  async getBeneficiarySheetSourceInfoOfPRR(): Promise<BeneficiarySheetSourceInfoOfPRR> {
    return this.beneficiariesAndProjectsPRRRepo.getBeneficiarySheetSourceInfoOfPRR();
  }

  async getBeneficiariesAndProjectsFiltersOfPRR(): Promise<BeneficiariesAndProjectsFiltersOfPRR> {
    return this.beneficiariesAndProjectsPRRRepo.getBeneficiariesAndProjectsFiltersOfPRR();
  }

  async getSpecificComponentsByDimensionsOfPRR(
    dsStructuralDimension?: string,
  ): Promise<SpecificComponentsByDimensionsOfPRR[]> {
    return this.beneficiariesAndProjectsPRRRepo.getSpecificComponentsByDimensionsOfPRR(
      dsStructuralDimension,
    );
  }

  async getSpecificInvestmentsByComponentsOfPRR(
    dsComponent?: string,
  ): Promise<SpecificInvestmentsByComponentsOfPRR[]> {
    return this.beneficiariesAndProjectsPRRRepo.getSpecificInvestmentsByComponentsOfPRR(
      dsComponent,
    );
  }
}
