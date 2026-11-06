import { gql } from "@apollo/client";


export function getSearchProjectsPT2030() {
  return gql(/* GraphQL */ `
    query getSearchProjects {
      queryBeneficiariesAndProjectsFiltersOfPortugal2030 {
        funds
        policyObjectives
        programmes
        thematicAreas
        regions
        municipalities
      }
      queryProjectsOfPortugal2030SourceInfo {
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


/* -------------------------------------------------------------------------------------------------------------------------------- */


export function getSpecificObjectivesByPolicyObjective() {
  return gql(/* GraphQL */ `
    query QuerySpecificObjectivesByPolicyObjectiveOfPortugal2030($policyObjective: String!) {
      querySpecificObjectivesByPolicyObjectiveOfPortugal2030(policyObjective: $policyObjective) {
        data {
          code
          shortName
        }
      }
    }
  `);
}


/* -------------------------------------------------------------------------------------------------------------------------------- */


export function getProjectsOfPortugal2030() {
  return gql(/* GraphQL */ `
    query SearchPT2030Projects(
      $limit: Int
      $page: Int
      $sortBy: ProjectSortBy
      $sortOrder: SortOrder
      $operationCode: String
      $operationName: String
      $funds: String
      $policyObjectives: String
      $specificObjectiveShortName: String
      $programmes: String
      $thematicAreas: String
      $regions: String
      $municipalities: String
      $approvedValueMin: Float
      $approvedValueMax: Float
      $executedValueMin: Float
      $executedValueMax: Float
      $paidValueMin: Float
      $paidValueMax: Float
    ) {
      searchProjectsOfPortugal2030(
        limit: $limit
        page: $page
        sortBy: $sortBy
        sortOrder: $sortOrder
        operationCode: $operationCode
        operationName: $operationName
        fund: $funds
        policyObjective: $policyObjectives
        specificObjectiveShortName: $specificObjectiveShortName
        programme: $programmes
        thematicArea: $thematicAreas
        region: $regions
        municipality: $municipalities
        approvedValueMin: $approvedValueMin
        approvedValueMax: $approvedValueMax
        executedValueMin: $executedValueMin
        executedValueMax: $executedValueMax
        paidValueMin: $paidValueMin
        paidValueMax: $paidValueMax
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


export function getSearchBeneficiariesPT2030() {
  return gql(/* GraphQL */ `
    query getSearchProjects {
      queryBeneficiariesAndProjectsFiltersOfPortugal2030 {
        funds
        policyObjectives
        programmes
        thematicAreas
        regions
        municipalities
      }
      queryBeneficiariesOfPortugal2030SourceInfo {
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

export function getBeneficiariesOfPortugal2030() {
  return gql(/* GraphQL */ `
    query SearchPT2030Beneficiaries(
      $limit: Int
      $page: Int
      $sortBy: BeneficiarySortBy
      $sortOrder: SortOrder
      $nif: String
      $name: String
      $entityRoles: [EntityRole!]
      $funds: String
      $policyObjectives: String
      $specificObjective: String
      $programmes: String
      $thematicAreas: String
      $regions: String
      $municipalities: String
      $approvedValueMin: Float
      $approvedValueMax: Float
      $executedValueMin: Float
      $executedValueMax: Float
      $paidValueMin: Float
      $paidValueMax: Float
      $projectsAmountMin: Int
      $projectsAmountMax: Int
    ) {
      searchBeneficiariesOfPortugal2030(
        limit: $limit
        page: $page
        sortBy: $sortBy
        sortOrder: $sortOrder
        nif: $nif
        name: $name
        entityRoles: $entityRoles
        fund: $funds
        policyObjective: $policyObjectives
        specificObjective: $specificObjective
        programme: $programmes
        thematicArea: $thematicAreas
        region: $regions
        municipality: $municipalities
        approvedValueMin: $approvedValueMin
        approvedValueMax: $approvedValueMax
        executedValueMin: $executedValueMin
        executedValueMax: $executedValueMax
        paidValueMin: $paidValueMin
        paidValueMax: $paidValueMax
        projectsAmountMin: $projectsAmountMin
        projectsAmountMax: $projectsAmountMax
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
          paidValueMin
          paidValueMax
          projectsAmountMin
          projectsAmountMax
        }
        data {
          entityName
          entityNif
          entityRole
          approvedValue
          executedValue
          paidValue
          projectsAmount
        }
      }
    }
  `);
}


/* -------------------------------------------------------------------------------------------------------------------------------- */


export function getPT2030ProjectMeta(locale: string = "pt") {
  return gql(/* GraphQL */ `
    query getProjectMeta {
      findFichaDeProjetoSingleton {
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


/* -------------------------------------------------------------------------------------------------------------------------------- */


export function getPT2030ProjectData(locale: string = "pt") {
  return gql(/* GraphQL */ `
    query getProject($codigoProjeto: String!) {
      findFichaDeProjetoSingleton {
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
          applications {
            ${locale} {
              id
              title
              description
              cards {
                card {
                  title
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
      queryProjectSheetOfPortugal2030(codigoProjeto: $codigoProjeto) {
        nome
        sumario
        modalidade
        candidaturas {
          tab_nome
          nota_final
          codigo_aviso
          designacao_aviso
        }
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
        objetivo_especifico
        valor_financiamento
        dt_conclusao_efetiva
        objetivo_estrategico
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


/* -------------------------------------------------------------------------------------------------------------------------------- */


export const queryLoadMoreBeneficiariesInProjectSheetOfPortugal2030 = gql(/* GraphQL */ `
  query loadMoreBeneficiariesInProjectSheetOfPortugal2030(
    $projectCode: String!
    $beneficiaryType: BeneficiaryType!
    $limit: Int
    $page: Int
  ) {
    queryBeneficiariesByProjectSheetOfPortugal2030(
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


/* -------------------------------------------------------------------------------------------------------------------------------- */


export function loadMoreBeneficiariesInProjectSheetOfPortugal2030() {
  return queryLoadMoreBeneficiariesInProjectSheetOfPortugal2030;
}


/* -------------------------------------------------------------------------------------------------------------------------------- */


export function getPT2030BeneficiaryMeta(locale: string = "pt") {
  return gql(/* GraphQL */ `
    query getPT2030BeneficiaryMeta {
      findFichaDeBeneficiarioSingleton {
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


/* -------------------------------------------------------------------------------------------------------------------------------- */


export function getPT2030BeneficiaryData(locale: string = "pt") {
  return gql(/* GraphQL */ `
    query getPT2030Beneficiary($nif: String!) {
      findFichaDeBeneficiarioSingleton {
        data {
          hero {
            ${locale} {
              title
              description
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
          beneficiarySheet {
            ${locale} {
              id
              title
            }
          }
          consortiums {
            ${locale} {
              id
              title
              subtitle
            }
          }
          distribution {
            ${locale} {
              id
              iconName
              title
              subtitle
              cards {
                card {
                  title
                  icon
                  subtitle
                  description
                  anchorGroup {
                    children
                  }
                }
              }
            }
          }
          projects {
            ${locale} {
              id
              iconName
              title
              cards {
                card {
                  title
                  anchor {
                    href
                    icon
                    children
                  }
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
      queryBeneficiarySheetOfPortugal2030(nif: $nif) {
        data {
          approvedValue
          entityName
          entityNif
          paidValue
          beneficiarySheet {
            approvedValue
            entityName
            entityNif
            projectsAmount
            paidValue
          }
          valuesByEntityRole {
            approvedValue
            entityRole
            executedValue
            percentageExecutedValue
            paidValue
          }
          numberOfProjectsByEntityRole {
            entityRole
            projectsAmount
          }
        }
        sourceInfo {
          format
          modificationDate
          publicationDate
          referenceDate
          source
          sourceLink
          title
          updateDate
          url
        }
      }
    }
  `);
}


/* -------------------------------------------------------------------------------------------------------------------------------- */


export const queryLoadMorePT2030ProjectsByBeneficiary = gql(/* GraphQL */ `
  query loadMoreProjectsByBeneficiary($nif: String!, $entityRole: EntityRole!, $page: Int) {
    queryProjectsByBeneficiarySheetOfPortugal2030(nif: $nif, entityRole: $entityRole, page: $page) {
      limit
      page
      total
      data {
        approvedValue
        effectiveConclusionDate
        operationCode
        operationName
      }
    }
  }
`);


/* -------------------------------------------------------------------------------------------------------------------------------- */


export function loadMorePT2030ProjectsByBeneficiary() {
  return queryLoadMorePT2030ProjectsByBeneficiary;
}

