import { DataStoryMetadata } from "@/service/types/datastories";
import apolloClient from "@/service/utils/apollo-client";
import { Datastory, DatastorySearchPage } from "@/service/types/datastories/datastory";
import { flattenData } from "@/utils/flattenObject";
import { buildDatastoryIndex } from "@/utils/buildDatastoryIndex";
import { gql } from "@apollo/client";
import { notFound } from "next/navigation";

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
