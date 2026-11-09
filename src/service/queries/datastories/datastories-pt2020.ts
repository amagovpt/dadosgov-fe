import { gql } from "@apollo/client";

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

/* -------------------------------------------------------------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------------------------------------------------------------- */

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
