import { DataStoryMetadata } from "@/service/types/datastories";
import apolloClient from "@/service/utils/apollo-client";
import { Datastory } from "@/service/types/datastories/datastory";
import { DatastorySearchPage } from "@/service/types/datastories/pt2030/pt2030";
import { flattenData } from "@/utils/flattenObject";
import { buildDatastoryIndex } from "@/utils/buildDatastoryIndex";
import { gql } from "@apollo/client";
import { notFound } from "next/navigation";

/* -------------------------------------------------------------------------------------------------------------------------------- */

export async function getDatastoryMetadata(
  slug: string,
  locale: string = "pt"
): Promise<DataStoryMetadata> {
  const query = gql(/* GraphQL */ `
    query QueryPublicDataModal($slug: String!) {
      queryDataStoriesContents(filter: $slug) {
        data {
          metadata{
            ${locale} {
              slug
              title
              image {
                fileName
                url
                id
              }
              createdAt
            }
          }
        }
      }
    }
  `);

  const { data, error } = await apolloClient.query<{
    queryDataStoriesContents: Array<{
      data: Record<string, unknown>;
    }>;
  }>({
    query: query,
    variables: {
      slug: `data/id/iv eq '${slug}'`,
    },
  });

  if (!data || error) {
    console.error("Error fetching datastory information:", error);
    throw new Error("Failed to fetch datastory information");
  }

  const datastory = data.queryDataStoriesContents[0]?.data;

  if (!datastory) {
    return {} as DataStoryMetadata;
  }

  return flattenData(datastory).metadata as DataStoryMetadata;
}

export async function getDatastory(slug: string, locale: string = "pt"): Promise<Datastory> {
  const query = gql(/* GraphQL */ `
    query QueryGetDataStoriesData($slug: String!) {
      queryDataStoriesContents(filter: $slug) {
        data {
          hero {
            ${locale} {
              title
              description
              index {
                title
              }
              breadcrumbs {
                label
                url
              }
            }
          }
          sections {
            ${locale} {
              isFirstSectionWhite
              sections {
                ... on SectionDatastoryBignumbersComponent {
                  schemaName
                  id
                  active
                  title
                  bignumbers {
                    icon
                    number
                    numberLabel
                    subtitle
                    title
                  }
                  dataReference {
                    date
                    title
                  }
                }
                ... on SectionDatastoryBignumbersIframeComponent {
                  id
                  active
                  schemaName
                  title
                  iframe {
                    source
                    classNames
                    classNameIframeBackground
                  }
                }
                ... on SectionDatastoryIframeComponent {
                  schemaName
                  id
                  active
                  description
                  title
                  links {
                    children
                    href
                    icon
                  }
                  iframe {
                    classNameIframeBackground
                    classNames
                    source
                  }
                }
                ... on SectionDatastoryOtherResourcesComponent {
                  schemaName
                  id
                  active
                  title
                  resources {
                    icon
                    title
                    subtitle
                    anchor {
                      href
                      icon
                    }
                  }
                }
                ... on SectionDatastoryRelatedDatastoryComponent {
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
                ... on SectionDatastoryTimelineComponent {
                  schemaName
                  id
                  active
                  title
                  description
                  cards {
                    title
                    subtitle
                  }
                  cardsLinkIcon
                  anchor {
                    children
                    icon
                  }
                  timeline {
                    title
                    description
                    events {
                      label
                      icon
                      title
                      description
                    }
                  }
                }
                ... on SectionDatastoryPublicAdminStructureComponent {
                  schemaName
                  id
                  active
                  title
                  parts {
                    centralAdmin {
                      icon
                      title
                      subtitle
                      description
                    }
                    regionalAdmin {
                      icon
                      title
                      subtitle
                      description
                    }
                    localAdmin {
                      icon
                      title
                      subtitle
                      description
                    }
                    socialFunds {
                      icon
                      title
                      subtitle
                      description
                    }
                    publicAdmin {
                      icon
                      title
                      subtitle
                      description
                    }
                  }
                }
                ... on SectionDatastorySummaryComponent {
                  schemaName
                  id
                  active
                  title
                  description
                  anchors {
                    children
                    href
                    icon
                  }
                }
                ... on SectionDatastoryDatasetsComponent {
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
      }
    }
  `);

  const { data, error } = await apolloClient.query<{
    queryDataStoriesContents: Array<{
      data: Record<string, unknown>;
    }>;
  }>({
    query: query,
    variables: {
      slug: `data/id/iv eq '${slug}'`,
    },
  });

  if (!data || error) {
    console.error("Error fetching datastory information:", error);
    throw new Error("Failed to fetch datastory information");
  }

  const datastory = data.queryDataStoriesContents[0]?.data;

  if (!datastory) {
    return notFound();
  }

  const { hero, sections } = flattenData(datastory) as Datastory;
  // `index` only asks for `title`, and flattenData unwraps single-key objects, so it
  // arrives as the title string itself.
  const index = hero?.index as unknown as string | { title?: string } | undefined;
  const indexTitle = typeof index === "string" ? index : (index?.title ?? "");

  return {
    hero: {
      ...hero,
      index: { title: indexTitle, anchors: buildDatastoryIndex(sections?.sections) },
    },
    sections,
  };
}

/* -------------------------------------------------------------------------------------------------------------------------------- */

export async function getDatastorySearchPage(
  slug: string,
  locale: string = "pt"
): Promise<DatastorySearchPage> {
  const query = gql(/* GraphQL */ `
    query QueryGetDataStoriesSearchPageData($slug: String!) {
      querySearchPagesEuropeanFundsContents(filter: $slug) {
        data {
          id {
            iv
          }
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
          bigNumberTitle{
            ${locale}
          }
          bigNumbers {
            ${locale} {
              description
            }
          }
          block {
            ${locale} {
              title
              description
            }
          }
          inputSearch {
            ${locale} {
              label
              placeholder
              searchActionAltText
              voiceActionAltText
            }
          }
          typesOfBeneficiariesTitle {
            ${locale}
          }
          typesOfBeneficiaries {
            ${locale} {
              name
              title
              description
            }
          }
          filters {
            ${locale} {
              name
              label
            }
          }
          sortBy {
            ${locale} {
              name
              label
            }
          }
          noResults {
            ${locale} {
              image {
                url
              }
              title
              description
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
        }
      }
    }
  `);

  const { data, error } = await apolloClient.query<{
    querySearchPagesEuropeanFundsContents: Array<{
      data: Record<string, unknown>;
    }>;
  }>({
    query: query,
    variables: {
      slug: `data/id/iv eq '${slug}'`,
    },
  });

  if (!data || error) {
    console.error("Error fetching datastory information:", error);
    throw new Error("Failed to fetch datastory information");
  }

  const datastory = data.querySearchPagesEuropeanFundsContents[0]?.data;

  if (!datastory) {
    return notFound();
  }

  const dataFlatten = flattenData(datastory) as DatastorySearchPage;

  return dataFlatten;
}

/* -------------------------------------------------------------------------------------------------------------------------------- */

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
