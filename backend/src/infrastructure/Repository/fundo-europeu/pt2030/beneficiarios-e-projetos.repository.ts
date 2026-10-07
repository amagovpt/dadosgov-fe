import { cachedQuery } from '@infrastructure/db/cached-query';
import AppError from '@utils/appError';
import {
  BeneficiariesOfPortugal2030,
  ProjectOfPortugal2030,
  BeneficiariesAndProjectsOfPortugal2030SourceInfo,
  BeneficiariesAndProjectsFiltersOfPortugal2030,
  SpecificObjectivesOfPortugal2030,
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
import {
  queryBeneficiariesAndProjectsFiltersOfPortugal2030,
  querySpecificObjectivesByPolicyObjectiveOfPortugal2030,
  // Beneficiaries
  queryBeneficiaryOfPortugal2030,
  queryBeneficiaryOfPortugal2030Count,
  queryBeneficiaryOfPortugal2030TotalCount,
  queryBeneficiaryOfPortugal2030SourceInfo,
  queryBeneficiarySheetOfPortugal2030,
  queryProjectsByBeneficiarySheetOfPortugal2030,
  queryBeneficiariesByProjectSheetOfPortugal2030,
  // Projects
  queryProjectsOfPortugal2030,
  queryProjectsOfPortugal2030TotalCount,
  queryProjectsOfPortugal2030Count,
  queryProjectsOfPortugal2030SourceInfo,
  queryProjectSheetOfPortugal2030,
} from './beneficiarios-e-projetos.queries';

export class BeneficiariesAndProjectsRepository implements IBeneficiariesAndProjectsRepository {
  async searchBeneficiariesOfPortugal2030(
    name?: string,
    nif?: string,
    page: number = 1,
    limit: number = 50,
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
    sortBy: BeneficiarySortBy = BeneficiarySortBy.APPROVED_VALUE,
    sortOrder: SortOrder = SortOrder.DESC,
  ): Promise<BeneficiariesOfPortugal2030> {
    try {
      const [countResult, totalCountResult] = await Promise.all([
        cachedQuery(queryBeneficiaryOfPortugal2030Count, [
          name || null,
          nif || null,
          fund || null,
          policyObjective || null,
          specificObjective || null,
          programme || null,
          thematicArea || null,
          region || null,
          municipality || null,
          entityRoles || null,
          projectsAmountMin ?? null,
          projectsAmountMax ?? null,
          approvedValueMin ?? null,
          approvedValueMax ?? null,
          executedValueMin ?? null,
          executedValueMax ?? null,
          paidValueMin ?? null,
          paidValueMax ?? null,
        ]),
        cachedQuery(queryBeneficiaryOfPortugal2030TotalCount),
      ]);

      const totalFiltered = parseInt(countResult.rows[0]?.total || '0', 10);
      const offset = (page - 1) * limit;

      let data = [];
      let filters = {
        approvedValueMin: 0,
        approvedValueMax: 0,
        executedValueMin: 0,
        executedValueMax: 0,
        projectsAmountMin: 0,
        projectsAmountMax: 0,
      };

      const effectiveLimit =
        offset < totalFiltered ? Math.min(limit, totalFiltered - offset) : 0;

      const dataResult = await cachedQuery(
        queryBeneficiaryOfPortugal2030,
        [
          name || null,
          nif || null,
          fund || null,
          policyObjective || null,
          specificObjective || null,
          programme || null,
          thematicArea || null,
          region || null,
          municipality || null,
          entityRoles || null,
          projectsAmountMin ?? null,
          projectsAmountMax ?? null,
          approvedValueMin ?? null,
          approvedValueMax ?? null,
          executedValueMin ?? null,
          executedValueMax ?? null,
          paidValueMin ?? null,
          paidValueMax ?? null,
          sortBy,
          sortOrder,
          effectiveLimit,
          offset,
        ],
      );

      const result = dataResult.rows[0]?.result || {};
      data = result.data || [];
      filters = result.filters || filters;

      return {
        data,
        filters,
        total: parseInt(totalCountResult.rows[0]?.total || '0', 10),
        totalFiltered,
        page,
        limit,
      };
    } catch (error) {
      throw new AppError(
        `Error searching beneficiaries of Portugal 2030: ${error}`,
      ).toGraphQLError();
    }
  }

  async getBeneficiariesOfPortugal2030SourceInfo(): Promise<BeneficiariesAndProjectsOfPortugal2030SourceInfo> {
    try {
      const result = await cachedQuery(
        queryBeneficiaryOfPortugal2030SourceInfo,
      );

      return {
        sourceInfo: result.rows[0]?.result || [],
      };
    } catch (error) {
      throw new AppError(
        `Error getting beneficiaries source info of Portugal 2030: ${error}`,
      ).toGraphQLError();
    }
  }

  async getBeneficiariesAndProjectsFiltersOfPortugal2030(): Promise<BeneficiariesAndProjectsFiltersOfPortugal2030> {
    try {
      const result = await cachedQuery(
        queryBeneficiariesAndProjectsFiltersOfPortugal2030,
      );

      const data = result.rows[0] || {};

      return {
        funds: data.funds || [],
        policyObjectives: data.policyobjectives || [],
        programmes: data.programmes || [],
        thematicAreas: data.thematicAreas || data.thematicareas || [],
        specificObjectives: data.specificobjectives || [],
        regions: data.regions || [],
        municipalities: data.municipalities || [],
      };
    } catch (error) {
      throw new AppError(
        `Error getting beneficiary filters of Portugal 2030: ${error}`,
      ).toGraphQLError();
    }
  }

  async getSpecificObjectivesByPolicyObjectiveOfPortugal2030(
    policyObjective?: string,
  ): Promise<SpecificObjectivesOfPortugal2030> {
    try {
      const result = await cachedQuery(
        querySpecificObjectivesByPolicyObjectiveOfPortugal2030,
        [policyObjective || null],
      );

      const data = result.rows[0] || {};
      const specificObjectives = data.specificobjectives || [];

      return {
        data: specificObjectives,
      };
    } catch (error) {
      throw new AppError(
        `Error getting specific objectives of Portugal 2030: ${error}`,
      ).toGraphQLError();
    }
  }

  async getBeneficiarySheetOfPortugal2030(
    nif: string,
  ): Promise<BeneficiarySheetOfPortugal2030> {
    try {
      const result = await cachedQuery(
        queryBeneficiarySheetOfPortugal2030,
        [nif],
      );

      return {
        data: result.rows[0]?.data || null,
        sourceInfo: result.rows[0]?.sourceInfo || [],
      };
    } catch (error) {
      throw new AppError(
        `Error getting beneficiary sheet of Portugal 2030: ${error}`,
      ).toGraphQLError();
    }
  }

  async getProjectsByBeneficiarySheetOfPortugal2030(
    nif: string,
    entityRole: EntityRole,
    page: number = 1,
    limit: number = 5,
  ): Promise<ProjectsByBeneficiarySheetOfPortugal2030> {
    try {
      const offset = (page - 1) * limit;

      const result = await cachedQuery(
        queryProjectsByBeneficiarySheetOfPortugal2030,
        [nif, entityRole, limit, offset],
      );
      const data = result.rows[0]?.result || {};
      const total = Number(data.total || 0);

      return {
        data: data.data || [],
        total,
        page,
        limit,
      };
    } catch (error) {
      throw new AppError(
        `Error getting projects by beneficiary sheet of Portugal 2030: ${error}`,
      ).toGraphQLError();
    }
  }

  async getBeneficiariesByProjectSheetOfPortugal2030(
    projectCode: string,
    beneficiaryType: BeneficiaryType = BeneficiaryType.MAIN,
    page: number = 1,
    limit: number = 5,
  ): Promise<BeneficiariesByProjectSheetOfPortugal2030> {
    try {
      const offset = (page - 1) * limit;

      const result = await cachedQuery(
        queryBeneficiariesByProjectSheetOfPortugal2030,
        [projectCode, beneficiaryType, limit, offset],
      );

      const payload = result.rows[0]?.result || {};

      return {
        data: payload.data || [],
        total: Number(payload.total || 0),
        page,
        limit,
      };
    } catch (error) {
      throw new AppError(
        `Error getting beneficiaries by project sheet of Portugal 2030: ${error}`,
      ).toGraphQLError();
    }
  }

  async searchProjectsOfPortugal2030(
    page: number = 1,
    limit: number = 50,
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
    sortBy: ProjectSortBy = ProjectSortBy.APPROVED_VALUE,
    sortOrder: SortOrder = SortOrder.DESC,
  ): Promise<ProjectOfPortugal2030> {
    try {
      const [totalCountResult, filteredCountResult] = await Promise.all([
        cachedQuery(queryProjectsOfPortugal2030TotalCount),
        cachedQuery(queryProjectsOfPortugal2030Count, [
          operationName || null,
          operationCode || null,
          fund || null,
          policyObjective || null,
          programme || null,
          thematicArea || null,
          region || null,
          municipality || null,
          specificObjectiveShortName || null,
          approvedValueMin ?? null,
          approvedValueMax ?? null,
          executedValueMin ?? null,
          executedValueMax ?? null,
          paidValueMin ?? null,
          paidValueMax ?? null,
          plannedConclusionDateMin || null,
          plannedConclusionDateMax || null,
        ]),
      ]);

      const total = parseInt(totalCountResult.rows[0]?.total || '0', 10);
      const totalFiltered = parseInt(
        filteredCountResult.rows[0]?.total || '0',
        10,
      );
      const offset = (page - 1) * limit;

      let data = [];
      let filters = {
        approvedValueMin: 0,
        approvedValueMax: 0,
        executedValueMin: 0,
        executedValueMax: 0,
        paidValueMin: 0,
        paidValueMax: 0,
        plannedConclusionDateMin: undefined,
        plannedConclusionDateMax: undefined,
      };

      const effectiveLimit =
        offset < totalFiltered ? Math.min(limit, totalFiltered - offset) : 0;

      const dataResult = await cachedQuery(
        queryProjectsOfPortugal2030,
        [
          operationName || null,
          operationCode || null,
          fund || null,
          policyObjective || null,
          programme || null,
          thematicArea || null,
          region || null,
          municipality || null,
          specificObjectiveShortName || null,
          approvedValueMin ?? null,
          approvedValueMax ?? null,
          executedValueMin ?? null,
          executedValueMax ?? null,
          paidValueMin ?? null,
          paidValueMax ?? null,
          plannedConclusionDateMin || null,
          plannedConclusionDateMax || null,
          sortBy,
          sortOrder,
          effectiveLimit,
          offset,
        ],
      );

      const result = dataResult.rows[0]?.result || {};
      data = result.data || [];
      filters = result.filters || filters;

      return {
        data,
        filters,
        total,
        totalFiltered,
        page,
        limit,
      };
    } catch (error) {
      throw new AppError(
        `Error searching projects of Portugal 2030: ${error}`,
      ).toGraphQLError();
    }
  }

  async getProjectsOfPortugal2030SourceInfo(): Promise<BeneficiariesAndProjectsOfPortugal2030SourceInfo> {
    try {
      const result = await cachedQuery(
        queryProjectsOfPortugal2030SourceInfo,
      );

      return {
        sourceInfo: result.rows[0]?.result || [],
      };
    } catch (error) {
      throw new AppError(
        `Error getting projects source info of Portugal 2030: ${error}`,
      ).toGraphQLError();
    }
  }

  async getProjectSheetOfPortugal2030(
    codigoProjeto?: string,
  ): Promise<ProjectSheetOfPortugal2030> {
    try {
      const result = await cachedQuery(
        queryProjectSheetOfPortugal2030,
        [codigoProjeto]
      );
      
      return result.rows[0]?.json_output || {};
    } catch (error) {
      throw new AppError(
        `Error getting project sheet of Portugal 2030: ${error}`,
      ).toGraphQLError();
    }
  }
}
