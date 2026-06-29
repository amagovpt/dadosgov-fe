import { DataStoryMetadata } from "@/service/types/datastories";
import apolloClient from "@/service/utils/apollo-client";
import { Datastory } from "@/service/types/datastories/datastory";
import { flattenData } from "@/utils/flattenObject";
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
          sections {
            ${locale} {
              isFirstSectionWhite
              sections {
                ... on SectionDatastoryBignumbersComponent {
                  schemaName
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
                ... on SectionDatastoryIframeComponent {
                  schemaName
                  id
                  description
                  title
                  iframe {
                    classNameIframeBackground
                    classNames
                    source
                  }
                }
                ... on DatasourceComponent {
                  schemaName
                  id
                  title
                  description
                  sources {
                    children
                    href
                  }
                }
                ... on SectionDatastoryOtherResourcesComponent {
                  schemaName
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
                  title
                  description
                  datastories {
                    data {
                      metadata {
                        pt {
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
                  title
                  description
                  anchors {
                    children
                    href
                    icon
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

  return flattenData(datastory) as Datastory;
}
