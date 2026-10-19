import {
  BeneficiariesSearchOfPRR,
  BeneficiariesSortByPRR,
  ProjectsSearchOfPRR,
  ProjectsOfPRRSourceInfo,
  SortOrder,
  BeneficiarySheetOfPRR,
  ProjectSheetOfPRR,
  ProjectSheetBeneficiaryFinancingOfPRR,
  ProjectSheetBeneficiaryTypeOfPRR,
  BeneficiaryProjectType,
  BeneficiaryRelatedProjectsOfPRR,
  ProjectsSortByPRR,
  SourceInfoOfPRR,
  BeneficiarySheetSourceInfoOfPRR,
  SpecificComponentsByDimensionsOfPRR,
  BeneficiariesAndProjectsFiltersOfPRR,
  SpecificInvestmentsByComponentsOfPRR,
} from '@domain/fundo-europeu/prr/beneficiarios-e-projetos';
import { BeneficiariesAndProjectsPRRUseCase } from '@useCases/fundo-europeu/prr.use-case';
import { Arg, Float, Int, Query, Resolver } from 'type-graphql';

@Resolver()
export class BeneficiariesAndProjectsPRRResolver {
  @Query(() => BeneficiariesSearchOfPRR)
  async searchBeneficiariesOfPRR(
    @Arg('recipientId', () => String, { nullable: true })
    recipientId?: string,
    @Arg('recipientName', () => String, { nullable: true })
    recipientName?: string,
    @Arg('municipality', () => String, { nullable: true })
    municipality?: string,
    @Arg('region', () => String, { nullable: true })
    region?: string,
    @Arg('dimension', () => String, { nullable: true })
    dimension?: string,
    @Arg('budgetMin', () => Float, { nullable: true })
    budgetMin?: number,
    @Arg('budgetMax', () => Float, { nullable: true })
    budgetMax?: number,
    @Arg('paidBudgetMin', () => Float, { nullable: true })
    paidBudgetMin?: number,
    @Arg('paidBudgetMax', () => Float, { nullable: true })
    paidBudgetMax?: number,
    @Arg('projectsAmountMin', () => Int, { nullable: true })
    projectsAmountMin?: number,
    @Arg('projectsAmountMax', () => Int, { nullable: true })
    projectsAmountMax?: number,
    @Arg('finalRecipient', () => Boolean, {
      nullable: true,
      defaultValue: true,
    })
    finalRecipient?: boolean,
    @Arg('intermediaryRecipient', () => Boolean, {
      nullable: true,
      defaultValue: true,
    })
    intermediaryRecipient?: boolean,
    @Arg('supplierRecipient', () => Boolean, {
      nullable: true,
      defaultValue: true,
    })
    supplierRecipient?: boolean,
    @Arg('partnerRecipient', () => Boolean, {
      nullable: true,
      defaultValue: true,
    })
    partnerRecipient?: boolean,
    @Arg('page', () => Int, { nullable: true, defaultValue: 1 })
    page?: number,
    @Arg('limit', () => Int, { nullable: true, defaultValue: 10 })
    limit?: number,
    @Arg('sortBy', () => BeneficiariesSortByPRR, {
      nullable: true,
      defaultValue: BeneficiariesSortByPRR.BUDGET,
    })
    sortBy?: BeneficiariesSortByPRR,
    @Arg('sortOrder', () => SortOrder, {
      nullable: true,
      defaultValue: SortOrder.DESC,
    })
    sortOrder?: SortOrder,
  ): Promise<BeneficiariesSearchOfPRR> {
    return new BeneficiariesAndProjectsPRRUseCase().searchBeneficiariesOfPRRUseCase(
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

  @Query(() => ProjectsSearchOfPRR)
  async searchProjectsOfPRR(
    @Arg('code', () => String, { nullable: true })
    code?: string,
    @Arg('description', () => String, { nullable: true })
    description?: string,
    @Arg('dimension', () => String, { nullable: true })
    dimension?: string,
    @Arg('dsNutsii', () => String, { nullable: true })
    dsNutsii?: string,
    @Arg('municipality', () => String, { nullable: true })
    municipality?: string,
    @Arg('budgetMin', () => Float, { nullable: true })
    budgetMin?: number,
    @Arg('budgetMax', () => Float, { nullable: true })
    budgetMax?: number,
    @Arg('endDateMin', () => String, { nullable: true })
    endDateMin?: string,
    @Arg('endDateMax', () => String, { nullable: true })
    endDateMax?: string,
    @Arg('page', () => Int, { nullable: true, defaultValue: 1 })
    page?: number,
    @Arg('limit', () => Int, { nullable: true, defaultValue: 10 })
    limit?: number,
    @Arg('sortBy', () => ProjectsSortByPRR, {
      nullable: true,
      defaultValue: ProjectsSortByPRR.BUDGET,
    })
    sortBy?: ProjectsSortByPRR,
    @Arg('sortOrder', () => SortOrder, {
      nullable: true,
      defaultValue: SortOrder.ASC,
    })
    sortOrder?: SortOrder,
  ): Promise<ProjectsSearchOfPRR> {
    const endDateMinDate = endDateMin ? new Date(endDateMin) : undefined;
    const endDateMaxDate = endDateMax ? new Date(endDateMax) : undefined;
    return new BeneficiariesAndProjectsPRRUseCase().searchProjectsOfPRRUseCase(
      code,
      description,
      dimension,
      dsNutsii,
      municipality,
      budgetMin,
      budgetMax,
      endDateMinDate,
      endDateMaxDate,
      page,
      limit,
      sortBy,
      sortOrder,
    );
  }

  @Query(() => ProjectsOfPRRSourceInfo)
  async queryProjectsOfPRRSourceInfo(): Promise<ProjectsOfPRRSourceInfo> {
    return new BeneficiariesAndProjectsPRRUseCase().getProjectsOfPRRSourceInfoUseCase();
  }

  @Query(() => BeneficiarySheetOfPRR)
  async queryBeneficiarySheetOfPRR(
    @Arg('nif', () => String) nif: string,
  ): Promise<BeneficiarySheetOfPRR> {
    return new BeneficiariesAndProjectsPRRUseCase().getBeneficiarySheetOfPRR(
      nif,
    );
  }

  @Query(() => BeneficiaryRelatedProjectsOfPRR)
  async queryBeneficiaryRelatedProjectsOfPRR(
    @Arg('nif', () => String) nif: string,
    @Arg('type', () => BeneficiaryProjectType) type: BeneficiaryProjectType,
    @Arg('page', () => Int, { nullable: true, defaultValue: 1 })
    page?: number,
    @Arg('limit', () => Int, { nullable: true, defaultValue: 5 })
    limit?: number,
  ): Promise<BeneficiaryRelatedProjectsOfPRR> {
    return new BeneficiariesAndProjectsPRRUseCase().getBeneficiaryRelatedProjectsOfPRR(
      nif,
      type,
      page,
      limit,
    );
  }

  @Query(() => ProjectSheetOfPRR)
  async queryProjectSheetOfPRR(
    @Arg('recipientId', () => String, { nullable: true }) recipientId?: string,
  ): Promise<ProjectSheetOfPRR> {
    return new BeneficiariesAndProjectsPRRUseCase().getProjectSheetOfPRR(
      recipientId,
    );
  }

  @Query(() => ProjectSheetBeneficiaryFinancingOfPRR)
  async queryProjectSheetBeneficiaryFinancingOfPRR(
    @Arg('projectCode', () => String, { nullable: true }) projectCode?: string,
    @Arg('beneficiaryType', () => ProjectSheetBeneficiaryTypeOfPRR, {
      nullable: true,
      defaultValue: ProjectSheetBeneficiaryTypeOfPRR.BENEFICIARY,
    })
    beneficiaryType?: ProjectSheetBeneficiaryTypeOfPRR,
    @Arg('page', () => Int, { nullable: true, defaultValue: 1 })
    page?: number,
    @Arg('limit', () => Int, { nullable: true, defaultValue: 10 })
    limit?: number,
  ): Promise<ProjectSheetBeneficiaryFinancingOfPRR> {
    return new BeneficiariesAndProjectsPRRUseCase().getProjectSheetBeneficiaryFinancingOfPRR(
      projectCode,
      beneficiaryType,
      page,
      limit,
    );
  }

  @Query(() => SourceInfoOfPRR)
  async queryBeneficiarySourceInfoOfPRR(): Promise<SourceInfoOfPRR> {
    return new BeneficiariesAndProjectsPRRUseCase().getBeneficiarySourceInfoOfPRR();
  }

  @Query(() => BeneficiarySheetSourceInfoOfPRR)
  async queryBeneficiarySheetSourceInfoOfPRR(): Promise<BeneficiarySheetSourceInfoOfPRR> {
    return new BeneficiariesAndProjectsPRRUseCase().getBeneficiarySheetSourceInfoOfPRR();
  }

  @Query(() => BeneficiariesAndProjectsFiltersOfPRR)
  async queryBeneficiariesAndProjectsFiltersOfPRR(): Promise<BeneficiariesAndProjectsFiltersOfPRR> {
    return new BeneficiariesAndProjectsPRRUseCase().getBeneficiariesAndProjectsFiltersOfPRR();
  }

  @Query(() => [SpecificComponentsByDimensionsOfPRR])
  async querySpecificComponentsByDimensionsOfPRR(
    @Arg('dsStructuralDimension', () => String, { nullable: true })
    dsStructuralDimension?: string,
  ): Promise<SpecificComponentsByDimensionsOfPRR[]> {
    return new BeneficiariesAndProjectsPRRUseCase().getSpecificComponentsByDimensionsOfPRR(
      dsStructuralDimension,
    );
  }

  @Query(() => [SpecificInvestmentsByComponentsOfPRR])
  async querySpecificInvestmentsByComponentsOfPRR(
    @Arg('dsComponent', () => String, { nullable: true })
    dsComponent?: string,
  ): Promise<SpecificInvestmentsByComponentsOfPRR[]> {
    return new BeneficiariesAndProjectsPRRUseCase().getSpecificInvestmentsByComponentsOfPRR(
      dsComponent,
    );
  }
}
