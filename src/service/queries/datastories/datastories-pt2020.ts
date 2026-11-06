import { gql } from "@apollo/client";

/* -------------------------------------------------------------------------------------------------------------------------------- */

/** PROJECTS LIST **/

export function getSearchProjectsPT2020() {
  return gql(/* GraphQL */ `
    query getSearchProjects {
      queryBeneficiariesAndProjectsFiltersOfPortugal2020 {
        funds
        programmes
        areas
        regions
        municipalities
      }
      queryProjectsOfPortugal2020SourceInfo {
        sourceInfo {
          format
          modificationDate
          publicationDate
          source
          referenceDate
          sourceLink
          title
          updateDate
          url
        }
      }
    }
  `);
}

export function getSpecificObjectivesByPolicyObjective() {
  return gql(/* GraphQL */ `
    query QuerySpecificObjectivesByPolicyObjectiveOfPortugal2020($policyObjective: String!) {
      querySpecificObjectivesByPolicyObjectiveOfPortugal2020(policyObjective: $policyObjective) {
        data {
          code
          shortName
        }
      }
    }
  `);
}

export function getProjectsOfPortugal2020() {
  return gql(/* GraphQL */ `
    query SearchPT2020Projects(
      $limit: Int
      $page: Int
      $sortBy: ProjectSortBy
      $sortOrder: SortOrder
      $operationCode: String
      $operationName: String
      $funds: String
      $programmes: String
      $areas: String
      $regions: String
      $municipalities: String
      $approvedValueMin: Float
      $approvedValueMax: Float
      $executedValueMin: Float
      $executedValueMax: Float
    ) {
      searchProjectsOfPortugal2020(
        limit: $limit
        page: $page
        sortBy: $sortBy
        sortOrder: $sortOrder
        operationCode: $operationCode
        operationName: $operationName
        fund: $funds
        programme: $programmes
        area: $areas
        region: $regions
        municipality: $municipalities
        approvedValueMin: $approvedValueMin
        approvedValueMax: $approvedValueMax
        executedValueMin: $executedValueMin
        executedValueMax: $executedValueMax
      ) {
        limit
        page
        total
        totalFiltered
        filters {
          approvedValueMin
          approvedValueMax
          executedValueMin
          executedValueMax
          paidValueMax
          paidValueMin
        }
        data {
          operationCode
          operationName
          approvedValue
          executedValue
          paidValue
          effectiveConclusionDate
          plannedConclusionDate
        }
      }
    }
  `);
}

/* -------------------------------------------------------------------------------------------------------------------------------- */

/** PROJECT SHEET **/

export function getPT2020ProjectMeta(locale: string = "pt") {
  return gql(/* GraphQL */ `
    query getPT2020ProjectMeta {
      findFichaDeProjetoPt2020Singleton {
        data {
          hero {
            ${locale} {
              title
              description
            }
          }
        }
      }
    }
  `);
}

export function getPT2020ProjectData(locale: string = "pt") {
  return gql(/* GraphQL */ `
    query getPT2020ProjectData($codigoProjeto: String!) {
      findFichaDeProjetoPt2020Singleton {
        data {
          hero {
            ${locale} {
              title
              breadcrumbs {
                url
                label
              }
              index {
                title
                anchors {
                  anchor {
                    href
                    children
                  }
                }
              }
              breadcrumbs {
                label
                url
              }
            }
          }
          projectSheet {
            ${locale} {
              id
              title
            }
          }
          beneficiaries {
            ${locale} {
              id
              title
              cards {
                card {
                  id
                  title
                  description
                }
              }
            }
          }
          geographicDistribution {
            ${locale} {
              id
              title
              cards {
                card {
                  title
                  description
                  icon
                }
              }
            }
          }
          datasets {
            ${locale} {
              schemaName
              id
              active
              title
              datasets {
                image {
                  url
                }
                createdAt
                organizationName
                title
                description
                slug
              }
            }
          }
        }
      }
      queryProjectSheetOfPortugal2020(codigoProjeto: $codigoProjeto) {
        nome
        sumario
        fornecedores
        info_datasets {
          info {
            url
            title
            format
            publication_date
            modification_date
          }
          source
          source_link
          reference_date
        }
        codigo_projeto
        valor_executado
        valor_pago
        dt_inicio_efetiva
        dt_inicio_prevista
        valor_financiamento
        dt_conclusao_efetiva
        dt_conclusao_prevista
        distribuicao_geografica {
          tipo
          order
          distribuicao {
            descricao
            valor_financiamento
            valor_pago
          }
          pc_valor_executado
          distribuicao_indefinida
          valor_financiamento_total
        }
      }
    }
  `);
}

export const queryLoadMoreBeneficiariesInProjectSheetOfPortugal2020 = gql(/* GraphQL */ `
  query loadMoreBeneficiariesInProjectSheetOfPortugal2020(
    $projectCode: String!
    $beneficiaryType: BeneficiaryType!
    $limit: Int
    $page: Int
  ) {
    queryBeneficiariesByProjectSheetOfPortugal2020(
      projectCode: $projectCode
      beneficiaryType: $beneficiaryType
      limit: $limit
      page: $page
    ) {
      limit
      page
      total
      data {
        entityNif
        name
        financingAmount
      }
    }
  }
`);

export function loadMoreBeneficiariesInProjectSheetOfPortugal2020() {
  return queryLoadMoreBeneficiariesInProjectSheetOfPortugal2020;
}

/* -------------------------------------------------------------------------------------------------------------------------------- */

/** BENEFICIARIES LIST **/

/* -------------------------------------------------------------------------------------------------------------------------------- */

/** BENEFICIARY SHEET **/

/* -------------------------------------------------------------------------------------------------------------------------------- */
