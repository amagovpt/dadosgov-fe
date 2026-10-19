import { cachedQuery } from '@infrastructure/db/cached-query';
import AppError from '@utils/appError';
import { SourceInfo } from '@/@types/shared-types';
import {
  BeneficiariesSearchOfPRR,
  IBeneficiariesAndProjectsPRRepository,
  BeneficiariesSortByPRR,
  SortOrder,
  ProjectsSearchOfPRR,
  ProjectsOfPRRSourceInfo,
  BeneficiarySheetOfPRR,
  ProjectSheetOfPRR,
  ProjectSheetBeneficiaryFinancingOfPRR,
  ProjectSheetBeneficiaryTypeOfPRR,
  TabBeneficiaryItemOfPRR,
  BeneficiaryProjectType,
  BeneficiaryRelatedProjectsOfPRR,
  ProjectsSortByPRR,
  BeneficiaryRelatedProject,
  SourceInfoOfPRR,
  BeneficiarySheetSourceInfoOfPRR,
  SourceInfoBeneficiarySheetItem,
  BeneficiariesAndProjectsFiltersOfPRR,
  SpecificComponentsByDimensionsOfPRR,
  SpecificInvestmentsByComponentsOfPRR,
} from '@domain/fundo-europeu/prr/beneficiarios-e-projetos';
import {
  searchBeneficiariesPRRCountQuery,
  searchBeneficiariesPRRFiltersQuery,
  searchBeneficiariesPRRQuery,
  searchBeneficiariesPRRTotalQuery,
  searchProjectsOfPRRQuery,
  searchProjectsOfPRRCountQuery,
  searchProjectsOfPRRSourceInfoQuery,
  searchProjectsOfPRRTotalQuery,
  beneficiarySheetPRRQuery,
  projectSheetPRRQuery,
  projectSheetPRRBeneficiaryFinancingQuery,
  beneficiaryRelatedProjectsPRRQuery,
  searchBeneficiarySourceInfoPRRQuery,
  queryBeneficiarySheetSourceInfo,
  queryBeneficiariesAndProjectsFiltersOfPRR,
  querySpecificComponentsByDimensionsOfPRR,
  querySpecificInvestmentsByComponentsOfPRR,
} from './beneficiarios-e-projetos.queries';

export class BeneficiariesAndProjectsPRRepository implements IBeneficiariesAndProjectsPRRepository {
  private buildOrderByClause(
    sortBy: BeneficiariesSortByPRR,
    sortOrder: SortOrder,
  ): string {
    const fieldMap: Record<BeneficiariesSortByPRR, string> = {
      [BeneficiariesSortByPRR.BUDGET]: '"budget"',
      [BeneficiariesSortByPRR.PAID_BUDGET]: '"paidBudget"',
      [BeneficiariesSortByPRR.PROJECTS_AMOUNT]: '"numProjects"',
    };

    const field = fieldMap[sortBy] || '"budget"';
    const direction = sortOrder === SortOrder.ASC ? 'ASC' : 'DESC';
    return `${field} ${direction}`;
  }

  async searchBeneficiariesOfPRR(
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
    page: number = 1,
    limit: number = 10,
    sortBy: BeneficiariesSortByPRR = BeneficiariesSortByPRR.BUDGET,
    sortOrder: SortOrder = SortOrder.DESC,
  ): Promise<BeneficiariesSearchOfPRR> {
    try {
      const safePage = Math.max(1, Math.trunc(page || 1));
      const safeLimit = Math.min(100, Math.max(1, Math.trunc(limit || 10)));
      const offset = (safePage - 1) * safeLimit;
      const recipientIdFilter = recipientId?.trim() || null;
      const recipientNameFilter = recipientName?.trim() || null;
      const municipalityFilter = municipality?.trim() || null;
      const regionFilter = region?.trim() || null;
      const dimensionFilter = dimension?.trim() || null;
      const budgetMinFilter = budgetMin ?? null;
      const budgetMaxFilter = budgetMax ?? null;
      const paidBudgetMinFilter = paidBudgetMin ?? null;
      const paidBudgetMaxFilter = paidBudgetMax ?? null;
      const projectsAmountMinFilter = projectsAmountMin ?? null;
      const projectsAmountMaxFilter = projectsAmountMax ?? null;
      const finalRecipientFilter = finalRecipient ?? true;
      const intermediaryRecipientFilter = intermediaryRecipient ?? true;
      const supplierRecipientFilter = supplierRecipient ?? true;
      const partnerRecipientFilter = partnerRecipient ?? true;

      const [countResult, totalResult, filtersResult] = await Promise.all([
        cachedQuery(searchBeneficiariesPRRCountQuery, [
          recipientIdFilter,
          recipientNameFilter,
          municipalityFilter,
          regionFilter,
          dimensionFilter,
          budgetMinFilter,
          budgetMaxFilter,
          paidBudgetMinFilter,
          paidBudgetMaxFilter,
          projectsAmountMinFilter,
          projectsAmountMaxFilter,
          finalRecipientFilter,
          intermediaryRecipientFilter,
          supplierRecipientFilter,
          partnerRecipientFilter,
        ]),
        cachedQuery(searchBeneficiariesPRRTotalQuery),
        cachedQuery(searchBeneficiariesPRRFiltersQuery),
      ]);

      const totalFiltered = Number(countResult.rows[0]?.total ?? 0);
      const total = Number(totalResult.rows[0]?.total ?? 0);
      const filters = filtersResult.rows[0] || {};
      const toNumberOrUndefined = (value: unknown): number | undefined =>
        value === null || value === undefined ? undefined : Number(value);

      const data =
        offset < totalFiltered
          ? await cachedQuery(
              searchBeneficiariesPRRQuery(
                this.buildOrderByClause(sortBy, sortOrder),
              ),
              [
                recipientIdFilter,
                recipientNameFilter,
                municipalityFilter,
                regionFilter,
                dimensionFilter,
                budgetMinFilter,
                budgetMaxFilter,
                paidBudgetMinFilter,
                paidBudgetMaxFilter,
                projectsAmountMinFilter,
                projectsAmountMaxFilter,
                finalRecipientFilter,
                intermediaryRecipientFilter,
                supplierRecipientFilter,
                partnerRecipientFilter,
                safeLimit,
                offset,
              ],
            )
          : { rows: [] };

      return {
        data: data.rows,
        filters: {
          budgetMax: toNumberOrUndefined(filters.budgetMax),
          budgetMin: toNumberOrUndefined(filters.budgetMin),
          paidBudgetMax: toNumberOrUndefined(filters.paidBudgetMax),
          paidBudgetMin: toNumberOrUndefined(filters.paidBudgetMin),
          projectsAmountMax: toNumberOrUndefined(filters.projectsAmountMax),
          projectsAmountMin: toNumberOrUndefined(filters.projectsAmountMin),
        },
        page: safePage,
        limit: safeLimit,
        totalFiltered,
        total,
      };
    } catch (error) {
      throw new AppError(
        `Error fetching beneficiaries and projects of PRR: ${error}`,
      ).toGraphQLError();
    }
  }

  async searchProjectsOfPRR(
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
    try {
      const codeFilter = code?.trim() || null;
      const descriptionFilter = description?.trim() || null;
      const dimensionFilter = dimension?.trim() || null;
      const dsNutsiiFilter = dsNutsii?.trim() || null;
      const municipalityFilter = municipality?.trim() || null;
      const budgetMinFilter = budgetMin ?? null;
      const budgetMaxFilter = budgetMax ?? null;
      const endDateMinFilter = endDateMin ?? null;
      const endDateMaxFilter = endDateMax ?? null;
      const safePage = Math.max(1, Math.trunc(page || 1));
      const safeLimit = Math.max(1, Math.trunc(limit || 10));
      const offset = (safePage - 1) * safeLimit;
      const safeSortBy = sortBy || ProjectsSortByPRR.BUDGET;
      const safeSortOrder = (sortOrder || SortOrder.ASC).toUpperCase();

      const [countResult, dataResult, totalResult] = await Promise.all([
        cachedQuery(searchProjectsOfPRRCountQuery, [
          codeFilter,
          descriptionFilter,
          dimensionFilter,
          dsNutsiiFilter,
          municipalityFilter,
          budgetMinFilter,
          budgetMaxFilter,
          endDateMinFilter,
          endDateMaxFilter,
        ]),
        cachedQuery(searchProjectsOfPRRQuery, [
          safeLimit,
          offset,
          codeFilter,
          descriptionFilter,
          dimensionFilter,
          dsNutsiiFilter,
          municipalityFilter,
          budgetMinFilter,
          budgetMaxFilter,
          endDateMinFilter,
          endDateMaxFilter,
          safeSortBy,
          safeSortOrder,
        ]),
        cachedQuery(searchProjectsOfPRRTotalQuery),
      ]);

      const totalFiltered = Number(countResult.rows[0]?.total ?? 0);
      const total = Number(totalResult.rows[0]?.total ?? 0);

      const resultData = dataResult.rows[0]?.result as Record<string, unknown>;
      const data = Array.isArray(resultData?.data) ? resultData.data : [];
      const filter = (resultData?.filter as Record<string, unknown>) || {};

      return {
        data: data as ProjectsSearchOfPRR['data'],
        filters: {
          budgetMin: filter.budgetMin ? Number(filter.budgetMin) : undefined,
          budgetMax: filter.budgetMax ? Number(filter.budgetMax) : undefined,
          endDateMin: filter.endDateMin ? String(filter.endDateMin) : undefined,
          endDateMax: filter.endDateMax ? String(filter.endDateMax) : undefined,
        },
        totalFiltered,
        total,
        page: safePage,
        limit: safeLimit,
      };
    } catch (error) {
      throw new AppError(
        `Error fetching projects of PRR: ${error}`,
      ).toGraphQLError();
    }
  }

  async getBeneficiarySheetOfPRR(nif: string): Promise<BeneficiarySheetOfPRR> {
    try {
      const result = await cachedQuery(beneficiarySheetPRRQuery, [nif]);

      const row = result.rows[0];
      if (!row) {
        return { data: undefined };
      }

      return {
        data: {
          nif: row.nif,
          name: row.name,
          totalProjects: Number(row.totalProjects || 0),
          budget: Number(row.budget || 0),
          location: row.location,
          economicActivity: row.economicActivity,
          beneficiaryForm:
            typeof row.beneficiaryForm === 'string'
              ? JSON.parse(row.beneficiaryForm)
              : row.beneficiaryForm,
          valuesByEntityRole:
            typeof row.valuesByEntityRole === 'string'
              ? JSON.parse(row.valuesByEntityRole)
              : row.valuesByEntityRole,
        },
      };
    } catch (error) {
      throw new AppError(
        `Error fetching beneficiary sheet of PRR: ${error}`,
      ).toGraphQLError();
    }
  }

  async getProjectSheetOfPRR(recipientId?: string): Promise<ProjectSheetOfPRR> {
    try {
      const result = await cachedQuery(projectSheetPRRQuery, [
        recipientId?.trim() || null,
      ]);

      const row = result.rows[0];
      if (!row) {
        return { data: undefined };
      }

      const toNumberOrUndefined = (value: unknown): number | undefined =>
        value === null || value === undefined ? undefined : Number(value);

      const mapContractDetails = (
        details: unknown,
      ):
        | {
            principalDescription?: string;
            contractsValue?: number;
            contractsCount?: number;
            secondaryDescription?: string[];
            detailContract?: { name?: string; value?: string; link?: string }[];
          }[]
        | undefined => {
        if (!Array.isArray(details)) {
          return undefined;
        }

        return details.map((item) => {
          const data = item as Record<string, unknown>;

          const detailContract = Array.isArray(data.detalhe_contrato)
            ? data.detalhe_contrato.map((supplier) => {
                const supplierData = supplier as Record<string, unknown>;
                return {
                  name:
                    typeof supplierData.nome === 'string'
                      ? supplierData.nome
                      : undefined,
                  value:
                    supplierData.valor === null ||
                    supplierData.valor === undefined
                      ? undefined
                      : String(supplierData.valor),
                  link:
                    typeof supplierData.link === 'string'
                      ? supplierData.link
                      : undefined,
                };
              })
            : undefined;

          return {
            principalDescription:
              typeof data.descricao_principal === 'string'
                ? data.descricao_principal
                : undefined,
            contractsValue: toNumberOrUndefined(data.valor_contratos),
            contractsCount: toNumberOrUndefined(data.numero_contratos),
            secondaryDescription: Array.isArray(data.descricao_secundaria)
              ? data.descricao_secundaria
                  .map((value) =>
                    value === null || value === undefined
                      ? undefined
                      : String(value),
                  )
                  .filter((value): value is string => Boolean(value))
              : undefined,
            detailContract,
          };
        });
      };

      const projectFormRaw = row.eu_prr_project_form as
        Record<string, unknown> | undefined;
      const projectContractsRaw = row.eu_prr_contracts as
        Record<string, unknown> | undefined;
      const tabsRaw = row.tabs as Record<string, unknown> | undefined;
      const geoDistributionRaw =
        tabsRaw?.eu_prr_projects_geo_distribution_financing as
          Record<string, unknown> | undefined;
      const contestAndContractsRaw = tabsRaw?.eu_prr_contest_and_contracts as
        Record<string, unknown> | undefined;
      const candidatureRaw = tabsRaw?.eu_prr_candidature as
        Record<string, unknown> | undefined;
      const contractsTabRaw = tabsRaw?.eu_prr_contracts as
        Record<string, unknown> | undefined;

      return {
        data: {
          recipientId: row.recipient_id,
          recipientName: row.recipient_name,
          recipientType: row.recipient_type,
          code: row.code,
          description: row.description,
          totalAgg: Number(row.total_agg ?? 0),
          executed: Number(row.executed ?? 0),
          subventions: Number(row.subventions ?? 0),
          loans: Number(row.loans ?? 0),
          endDate: row.end_date,
          summary: row.summary,
          total: Number(row.total ?? 0),
          dimensionCode: row.dimension_code,
          dimension: row.dimension,
          componentCode: row.component_code,
          component: row.component,
          investmentCode: row.investment_code,
          investment: row.investment,
          consortium: Boolean(row.flg_consorcio),
          projectForm: projectFormRaw
            ? {
                name:
                  typeof projectFormRaw.nome === 'string'
                    ? projectFormRaw.nome
                    : undefined,
                totalProjectValue: toNumberOrUndefined(
                  projectFormRaw.valor_total_projeto,
                ),
                grantFunding: toNumberOrUndefined(
                  projectFormRaw.financiamento_fundo_perdido,
                ),
                loanFunding: toNumberOrUndefined(
                  projectFormRaw.financiamento_emprestimos,
                ),
                executedValue: toNumberOrUndefined(
                  projectFormRaw.valor_executado,
                ),
                startDate:
                  typeof projectFormRaw.data_inicio === 'string'
                    ? projectFormRaw.data_inicio
                    : undefined,
                plannedConclusionDate:
                  typeof projectFormRaw.data_conclusao_prevista === 'string'
                    ? projectFormRaw.data_conclusao_prevista
                    : undefined,
                dimension:
                  typeof projectFormRaw.dimensao === 'string'
                    ? projectFormRaw.dimensao
                    : undefined,
                summary:
                  typeof projectFormRaw.sumario === 'string'
                    ? projectFormRaw.sumario
                    : undefined,
                component:
                  typeof projectFormRaw.componente === 'string'
                    ? projectFormRaw.componente
                    : undefined,
                investment:
                  typeof projectFormRaw.investimento === 'string'
                    ? projectFormRaw.investimento
                    : undefined,
              }
            : undefined,
          projectContracts: projectContractsRaw
            ? {
                tabName:
                  typeof projectContractsRaw.tab_nome === 'string'
                    ? projectContractsRaw.tab_nome
                    : undefined,
                totalContractsValue: toNumberOrUndefined(
                  projectContractsRaw.valor_contratos,
                ),
                contractsCount: toNumberOrUndefined(
                  projectContractsRaw.numero_contratos,
                ),
                contractDetails: mapContractDetails(
                  projectContractsRaw.detalhe_contratos,
                ),
              }
            : undefined,
          tabs: tabsRaw
            ? {
                geoDistributionFinancing: geoDistributionRaw
                  ? {
                      tabName:
                        typeof geoDistributionRaw.tab_nome === 'string'
                          ? geoDistributionRaw.tab_nome
                          : undefined,
                      source:
                        typeof geoDistributionRaw.source === 'string'
                          ? geoDistributionRaw.source
                          : undefined,
                      sourceLink:
                        typeof geoDistributionRaw.source_link === 'string'
                          ? geoDistributionRaw.source_link
                          : undefined,
                      referenceDate:
                        typeof geoDistributionRaw.reference_date === 'string'
                          ? geoDistributionRaw.reference_date
                          : undefined,
                      valuePercentage: toNumberOrUndefined(
                        geoDistributionRaw.valor_percentagem,
                      ),
                      distribution: Array.isArray(
                        geoDistributionRaw.distribuicao,
                      )
                        ? geoDistributionRaw.distribuicao.map((item) => {
                            const data = item as Record<string, unknown>;
                            return {
                              type:
                                typeof data.tipo === 'string'
                                  ? data.tipo
                                  : undefined,
                              divisions: Array.isArray(data.divisoes)
                                ? data.divisoes.map((division) => {
                                    const divisionData = division as Record<
                                      string,
                                      unknown
                                    >;
                                    return {
                                      description:
                                        typeof divisionData.descricao ===
                                        'string'
                                          ? divisionData.descricao
                                          : undefined,
                                      value: toNumberOrUndefined(
                                        divisionData.valor,
                                      ),
                                    };
                                  })
                                : undefined,
                            };
                          })
                        : undefined,
                    }
                  : undefined,
                contestAndContracts: contestAndContractsRaw
                  ? {
                      tabName:
                        typeof contestAndContractsRaw.tab_nome === 'string'
                          ? contestAndContractsRaw.tab_nome
                          : undefined,
                      criteria: Array.isArray(contestAndContractsRaw.criterios)
                        ? contestAndContractsRaw.criterios
                            .map((value) =>
                              value === null || value === undefined
                                ? undefined
                                : String(value),
                            )
                            .filter((value): value is string => Boolean(value))
                        : undefined,
                      contractDetails: mapContractDetails(
                        contestAndContractsRaw.detalhe_contratos,
                      ),
                    }
                  : undefined,
                candidature: candidatureRaw
                  ? {
                      tabName:
                        typeof candidatureRaw.tab_nome === 'string'
                          ? candidatureRaw.tab_nome
                          : undefined,
                      finalScore:
                        candidatureRaw.nota_final === null ||
                        candidatureRaw.nota_final === undefined
                          ? undefined
                          : String(candidatureRaw.nota_final),
                      baseScore:
                        candidatureRaw.nota_base === null ||
                        candidatureRaw.nota_base === undefined
                          ? undefined
                          : String(candidatureRaw.nota_base),
                      link:
                        typeof candidatureRaw.link === 'string'
                          ? candidatureRaw.link
                          : undefined,
                    }
                  : undefined,
                contracts: contractsTabRaw
                  ? {
                      tabName:
                        typeof contractsTabRaw.tab_nome === 'string'
                          ? contractsTabRaw.tab_nome
                          : undefined,
                      totalContractsValue: toNumberOrUndefined(
                        contractsTabRaw.valor_contratos,
                      ),
                      contractsCount: toNumberOrUndefined(
                        contractsTabRaw.numero_contratos,
                      ),
                      contractDetails: mapContractDetails(
                        contractsTabRaw.detalhe_contratos,
                      ),
                    }
                  : undefined,
              }
            : undefined,
        },
      };
    } catch (error) {
      throw new AppError(
        `Error fetching project sheet of PRR: ${error}`,
      ).toGraphQLError();
    }
  }

  async getProjectSheetBeneficiaryFinancingOfPRR(
    projectCode?: string,
    beneficiaryType: ProjectSheetBeneficiaryTypeOfPRR = ProjectSheetBeneficiaryTypeOfPRR.BENEFICIARY,
    page: number = 1,
    limit: number = 10,
  ): Promise<ProjectSheetBeneficiaryFinancingOfPRR> {
    try {
      const safePage = Math.max(1, Math.trunc(page || 1));
      const safeLimit = Math.max(1, Math.trunc(limit || 10));
      const offset = (safePage - 1) * safeLimit;

      const result = await cachedQuery(
        projectSheetPRRBeneficiaryFinancingQuery,
        [projectCode?.trim() || null, beneficiaryType, safeLimit, offset],
      );

      const row = result.rows[0];
      if (!row) {
        return {
          data: [],
          beneficiaryType,
          page: safePage,
          limit: safeLimit,
          totalFiltered: 0,
          total: 0,
        };
      }

      const rawData =
        row.data ??
        row.eu_prr_beneficiary_financing ??
        row.eu_prr_beneficiary_financing?.data ??
        [];

      const data = Array.isArray(rawData)
        ? (rawData as TabBeneficiaryItemOfPRR[])
        : [];
      const totalFiltered = Number(row.total ?? 0);

      return {
        data,
        beneficiaryType,
        page: safePage,
        limit: safeLimit,
        totalFiltered,
        total: totalFiltered,
      };
    } catch (error) {
      throw new AppError(
        `Error fetching project sheet beneficiary financing of PRR: ${error}`,
      ).toGraphQLError();
    }
  }

  async getProjectsOfPRRSourceInfo(): Promise<ProjectsOfPRRSourceInfo> {
    try {
      const result = await cachedQuery(searchProjectsOfPRRSourceInfoQuery);

      return {
        sourceInfo: result?.rows[0]?.sourceinfo || [],
      };
    } catch (error) {
      throw new AppError(
        `Error fetching projects source info of PRR: ${error}`,
      ).toGraphQLError();
    }
  }

  async getBeneficiaryRelatedProjectsOfPRR(
    nif: string,
    projectType: BeneficiaryProjectType,
    page: number = 1,
    limit: number = 5,
  ): Promise<BeneficiaryRelatedProjectsOfPRR> {
    try {
      const safePage = Math.max(1, Math.trunc(page || 1));
      const safeLimit = Math.max(1, Math.trunc(limit || 5));
      const offset = (safePage - 1) * safeLimit;

      const result = await cachedQuery(beneficiaryRelatedProjectsPRRQuery, [
        nif?.trim() || null,
        projectType,
      ]);

      const row = result.rows[0];

      if (!row) {
        return {
          nif: nif || '',
          total: 0,
          data: [],
        };
      }

      const total =
        row.total === null || row.total === undefined ? 0 : Number(row.total);

      // Apply pagination to JSONB array in application layer
      const allData = (row.data || []) as BeneficiaryRelatedProject[];
      const paginatedData = allData.slice(offset, offset + safeLimit);

      return {
        nif: row.nif,
        total: total || 0,
        data: paginatedData,
      };
    } catch (error) {
      throw new AppError(
        `Error fetching beneficiary projects by type of PRR: ${error}`,
      ).toGraphQLError();
    }
  }

  async getBeneficiarySourceInfoOfPRR(): Promise<SourceInfoOfPRR> {
    try {
      const result = await cachedQuery(searchBeneficiarySourceInfoPRRQuery, []);

      const row = result.rows[0];

      if (!row) {
        return {
          sourceInfo: [],
        };
      }

      // Cast the JSONB result to typed array
      const sourceInfo = (row.result || []) as SourceInfo[];

      return {
        sourceInfo: sourceInfo,
      };
    } catch (error) {
      throw new AppError(
        `Error fetching beneficiary source info of PRR: ${error}`,
      ).toGraphQLError();
    }
  }

  async getBeneficiarySheetSourceInfoOfPRR(): Promise<BeneficiarySheetSourceInfoOfPRR> {
    try {
      const result = await cachedQuery(queryBeneficiarySheetSourceInfo, []);

      const row = result.rows[0];

      if (!row) {
        return { sourceInfo: [] };
      }

      const sourceInfo = (row.sourceinfo ||
        []) as SourceInfoBeneficiarySheetItem[];

      return { sourceInfo };
    } catch (error) {
      throw new AppError(
        `Error fetching beneficiary sheet source info of PRR: ${error}`,
      ).toGraphQLError();
    }
  }

  async getBeneficiariesAndProjectsFiltersOfPRR(): Promise<BeneficiariesAndProjectsFiltersOfPRR> {
    try {
      const result = await cachedQuery(
        queryBeneficiariesAndProjectsFiltersOfPRR,
        [],
      );

      const row = result.rows[0];

      if (!row) {
        return {} as BeneficiariesAndProjectsFiltersOfPRR;
      }

      return row as BeneficiariesAndProjectsFiltersOfPRR;
    } catch (error) {
      throw new AppError(
        `Error fetching beneficiaries and projects filters of PRR: ${error}`,
      ).toGraphQLError();
    }
  }

  async getSpecificComponentsByDimensionsOfPRR(
    dsStructuralDimension?: string,
  ): Promise<SpecificComponentsByDimensionsOfPRR[]> {
    try {
      const result = await cachedQuery(
        querySpecificComponentsByDimensionsOfPRR,
        [dsStructuralDimension || null],
      );

      return (result.rows[0]?.specific_components ??
        []) as SpecificComponentsByDimensionsOfPRR[];
    } catch (error) {
      throw new AppError(
        `Error fetching specific components by dimension of PRR: ${error}`,
      ).toGraphQLError();
    }
  }

  async getSpecificInvestmentsByComponentsOfPRR(
    dsComponent?: string,
  ): Promise<SpecificInvestmentsByComponentsOfPRR[]> {
    try {
      const result = await cachedQuery(
        querySpecificInvestmentsByComponentsOfPRR,
        [dsComponent || null],
      );

      return (result.rows[0]?.specific_investments ??
        []) as SpecificInvestmentsByComponentsOfPRR[];
    } catch (error) {
      throw new AppError(
        `Error fetching specific investments by component of PRR: ${error}`,
      ).toGraphQLError();
    }
  }
}
