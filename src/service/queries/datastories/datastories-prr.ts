import {
  DimensionDataQueries,
  DimensionPage,
  PRRBeneficiaryRelatedProjectsType,
} from "@/service/types/datastories/prr/prr";
import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";
import { notFound } from "next/navigation";


// The PRR dimension pages have a schema of their own (`Dimensoes`) in Squidex
export async function getDimensionPage(
  slug: string,
  locale: string = "pt"
): Promise<DimensionPage> {
  const query = gql(/* GraphQL */ `
    query QueryGetDimensionPageData($slug: String!) {
      queryDimensoesContents(filter: $slug) {
        data {
          hero {
            ${locale} {
              title
              description
              index {
                title
                anchors {
                  anchor {
                    href
                    children
                    icon
                  }
                }
              }
              breadcrumbs {
                url
                label
              }
            }
          }
          dimensionInNumbers{
            ${locale}
          }
          bigNumbers {
            ${locale} {
              description
            }
          }
          investmentsInDetail {
            ${locale} {
              title
              description
            }
          }
          reformsInDetail {
            ${locale} {
              title
              description
            }
          }
          relatedDatastories {
            ${locale} {
              schemaName
              id
              active
              title
              description
              datastories {
                data {
                  metadata {
                    ${locale} {
                      createdAt
                      description
                      slug
                      title
                    }
                  }
                }
              }
            }
          }
          relatedDatasets {
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
    }
  `);

  const { data, error } = await apolloClient.query<{
    queryDimensoesContents: Array<{
      data: Record<string, unknown>;
    }>;
  }>({
    query: query,
    variables: {
      slug: `data/id/iv eq '${slug}'`,
    },
  });

  if (!data || error) {
    console.error("Error fetching dimension page information:", error);
    throw new Error("Failed to fetch dimension page information");
  }

  const page = data.queryDimensoesContents[0]?.data;

  if (!page) {
    return notFound();
  }

  return flattenData(page) as DimensionPage;
}


/* -------------------------------------------------------------------------------------------------------------------------------- */


export function getSearchProjectsPRR() {
  return gql(/* GraphQL */ `
    query getSearchProjectsPRR {
      queryBeneficiariesAndProjectsFiltersOfPRR {
        dimensions
        regions
        municipalities
      }
      queryProjectsOfPRRSourceInfo {
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


export function getProjectsTotalsPRR() {
  return gql(/* GraphQL */ `
    query getProjectsTotalsPRR {
      queryProjectsTotalsOfPRR {
        projects
        approvedValue
        executedValue
        endDateMin
        endDateMax
      }
    }
  `);
}


/* -------------------------------------------------------------------------------------------------------------------------------- */


const DIMENSION_MILESTONES_FIELDS = `
  milestonesTargets {
    completionPercentage
    dsExecutionIndicator
    dtConclusionMilestoneTarget
    executionIndicatorName
    numberOfInterventions
    finished
    hasGraph
    milestoneOrTarget
    graphicData {
      baseline
      objective
      quarter
      year
    }
  }
`;

const DIMENSION_SOURCE_INFO_FIELDS = `
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
`;

export function getDimensionData(queries: DimensionDataQueries) {
  return gql(/* GraphQL */ `
    query getDimensionData {
      inNumbers: ${queries.inNumbers} {
        totalInvestmentPrr
        allocatedFundsDimension
        fundsSpentDimension
      }
      investments: ${queries.investments} {
        data {
          id
          name
          number
          completionPercentage
          investments {
            amountSpent
            assignedAmount
            cdInvestment
            completionDate
            completionPercentage
            finished
            idInvestment
            investmentDateCompletion
            investmentDescription
            investmentName
            loanValue
            lostFundAmount
            ${DIMENSION_MILESTONES_FIELDS}
          }
        }
        ${DIMENSION_SOURCE_INFO_FIELDS}
      }
      reforms: ${queries.reforms} {
        data {
          id
          name
          number
          completionPercentage
          reforms {
            amountSpent
            assignedAmount
            cdReform
            completionDate
            completionPercentage
            dsReform
            finished
            nameReform
            reformId
            renovationCompletionDate
            ${DIMENSION_MILESTONES_FIELDS}
          }
        }
        ${DIMENSION_SOURCE_INFO_FIELDS}
      }
    }
  `);
}


/* -------------------------------------------------------------------------------------------------------------------------------- */


export function getProjectsOfPRR() {
  return gql(/* GraphQL */ `
    query SearchPRRProjects(
      $budgetMax: Float
      $budgetMin: Float
      $code: String
      $description: String
      $dimension: String
      $dsNutsii: String
      $endDateMax: String
      $endDateMin: String
      $limit: Int
      $municipality: String
      $page: Int
      $sortBy: ProjectsSortByPRR
      $sortOrder: SortOrder
    ) {
      searchProjectsOfPRR(
        budgetMax: $budgetMax
        budgetMin: $budgetMin
        code: $code
        description: $description
        dimension: $dimension
        dsNutsii: $dsNutsii
        endDateMax: $endDateMax
        endDateMin: $endDateMin
        limit: $limit
        municipality: $municipality
        page: $page
        sortBy: $sortBy
        sortOrder: $sortOrder
      ) {
        limit
        page
        total
        totalFiltered
        filters {
          budgetMax
          budgetMin
          endDateMax
          endDateMin
        }
        data {
          code
          description
          investment
          dimension
          dsNutsii
          dsMunicipality
          budget
          total
          executedValue
          endDate
        }
      }
    }
  `);
}


/* -------------------------------------------------------------------------------------------------------------------------------- */


export function getSearchBeneficiariesPRR() {
  return gql(/* GraphQL */ `
    query getSearchBeneficiariesPRR {
      queryBeneficiariesAndProjectsFiltersOfPRR {
        dimensions
        regions
        municipalities
      }
      queryBeneficiarySourceInfoOfPRR {
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

export function getBeneficiariesOfPRR() {
  return gql(/* GraphQL */ `
    query SearchPRRBeneficiaries(
      $budgetMax: Float
      $budgetMin: Float
      $dimension: String
      $finalRecipient: Boolean
      $intermediaryRecipient: Boolean
      $limit: Int
      $municipality: String
      $page: Int
      $paidBudgetMax: Float
      $paidBudgetMin: Float
      $partnerRecipient: Boolean
      $projectsAmountMax: Int
      $projectsAmountMin: Int
      $recipientId: String
      $recipientName: String
      $region: String
      $sortBy: BeneficiariesSortByPRR
      $sortOrder: SortOrder
      $supplierRecipient: Boolean
    ) {
      searchBeneficiariesOfPRR(
        budgetMax: $budgetMax
        budgetMin: $budgetMin
        dimension: $dimension
        finalRecipient: $finalRecipient
        intermediaryRecipient: $intermediaryRecipient
        limit: $limit
        municipality: $municipality
        page: $page
        paidBudgetMax: $paidBudgetMax
        paidBudgetMin: $paidBudgetMin
        partnerRecipient: $partnerRecipient
        projectsAmountMax: $projectsAmountMax
        projectsAmountMin: $projectsAmountMin
        recipientId: $recipientId
        recipientName: $recipientName
        region: $region
        sortBy: $sortBy
        sortOrder: $sortOrder
        supplierRecipient: $supplierRecipient
      ) {
        limit
        page
        total
        totalFiltered
        filters {
          budgetMax
          budgetMin
          paidBudgetMax
          paidBudgetMin
          projectsAmountMax
          projectsAmountMin
        }
        data {
          recipientId
          recipientName
          recipientType
          dimension
          dsNutsii
          dsMunicipalities
          numProjects
          budget
          paidBudget
          finalRecipient
          intermediaryRecipient
          supplierRecipient
          partnerRecipient
        }
      }
    }
  `);
}


/* -------------------------------------------------------------------------------------------------------------------------------- */


export function getPrrProjectMeta(locale: string = "pt") {
  return gql(/* GraphQL */ `
    query getPrrProjectMeta {
      findFichaDeProjetoPrrSingleton {
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

export function getPrrProjectData(locale: string = "pt") {
  return gql(/* GraphQL */ `
    query getPrrProjectData {
      findFichaDeProjetoPrrSingleton {
        data {
          hero {
            ${locale} {
              title
              description
              index {
                title
                anchors {
                  anchor {
                    children
                    href
                    icon
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
              iconName
              title
            }
          }
          beneficiaries {
            ${locale} {
              id
              title
              cards {
                card {
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
              subtitle
              description
              cards {
                card {
                  title
                  description
                }
              }
            }
          }
          publicContracting {
            ${locale} {
              id
              title
              description
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
    }
  `);
}

export function getPrrProjectSheet() {
  return gql(/* GraphQL */ `
    query getPrrProjectSheet($recipientId: String!) {
      queryProjectSheetOfPRR(recipientId: $recipientId) {
        data {
          code
          projectForm {
            component
            dimension
            executedValue
            grantFunding
            investment
            loanFunding
            name
            plannedConclusionDate
            startDate
            summary
            totalProjectValue
          }
          tabs {
            candidature {
              baseScore
              finalScore
              tabName
              link
            }
            contracts {
              contractsCount
              tabName
              totalContractsValue
              contractDetails {
                contractsCount
                contractsValue
                principalDescription
                secondaryDescription
                detailContract {
                  link
                  name
                  value
                }
              }
            }
            contestAndContracts {
              tabName
              criteria
              contractDetails {
                contractsCount
                contractsValue
                principalDescription
                secondaryDescription
                detailContract {
                  link
                  name
                  value
                }
              }
            }
            geoDistributionFinancing {
              tabName
              source
              sourceLink
              referenceDate
              valuePercentage
              distribution {
                type
                divisions {
                  description
                  value
                }
              }
            }
          }
        }
      }
    }
  `);
}

export function loadMorePrrProjectSheetBeneficiaryFinancing(
  beneficiaryType: "BENEFICIARY" | "INTERMEDIARY_BENEFICIARY" | "PARTNER" | "SUPPLIER"
) {
  return gql(/* GraphQL */ `
    query loadMorePrrProjectSheetBeneficiaryFinancing(
      $page: Int
      $limit: Int
      $projectCode: String
    ) {
      queryProjectSheetBeneficiaryFinancingOfPRR(
        page: $page
        limit: $limit
        projectCode: $projectCode
        beneficiaryType: ${beneficiaryType}
      ) {
        totalFiltered
        total
        page
        limit
        beneficiaryType
        data {
          description
          id
          name
          paid
        }
      }
    }
  `);
}


/* -------------------------------------------------------------------------------------------------------------------------------- */


export function getPrrBeneficiaryMeta(locale: string = "pt") {
  return gql`
    query getPrrBeneficiaryMeta {
      findFichaDeBeneficiarioPrrSingleton {
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
  `;
}

export function getPrrBeneficiaryData(locale: string = "pt") {
  return gql`
    query getPrrBeneficiaryData {
      findFichaDeBeneficiarioPrrSingleton {
        data {
          hero {
            ${locale} {
              title
              description
              index {
                title
                anchors {
                  anchor {
                    children
                    href
                    icon
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
              iconName
              title
            }
          }
          consortiums {
            ${locale} {
              id
              iconName
              title
              subtitle
              description
              cards {
                card {
                  title
                  subtitle
                  description
                  icon
                  anchor {
                    children
                    href
                    icon
                  }
                }
              }
            }
          }
          distribution {
            ${locale} {
              id
              iconName
              title
              subtitle
              description
              cards {
                card {
                  title
                  subtitle
                  description
                  icon
                  anchor {
                    children
                    href
                    icon
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
              subtitle
              description
              cards {
                card {
                  title
                  subtitle
                  description
                  icon
                  anchor {
                    children
                    href
                    icon
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
    }
  `;
}

export function getPrrBeneficiarySheet() {
  return gql`
    query getPrrBeneficiarySheet($nif: String!) {
      queryBeneficiarySheetOfPRR(nif: $nif) {
        data {
          budget
          economicActivity
          location
          name
          nif
          totalProjects
          beneficiaryForm {
            economicActivity
            location
            name
            nif
            totalConsortiumParticipations
            totalProjects
          }
          valuesByEntityRole {
            approvedValue
            entityRole
            executedValue
            percentageExecutedValue
          }
        }
      }
    }
  `;
}

export function getPrrBeneficiarySourceInfo() {
  return gql`
    query getPrrBeneficiarySourceInfo {
      queryBeneficiarySheetSourceInfoOfPRR {
        sourceInfo {
          format
          publicationDate
          modificationDate
          sourceLink
          source
          title
          url
        }
      }
    }
  `;
}

export function queryLoadMorePrrProjectsByBeneficiary(type: PRRBeneficiaryRelatedProjectsType) {
  return gql`
    query queryLoadMorePrrProjectsByBeneficiary(
      $nif: String!
      $page: Int
      $limit: Int
    ) {
      queryBeneficiaryRelatedProjectsOfPRR(
        nif: $nif
        type: ${type}
        page: $page
        limit: $limit
      ) {
        nif
        total
        data {
          amount
          date
          id
          name
          paid
        }
      }
    }
  `;
}
