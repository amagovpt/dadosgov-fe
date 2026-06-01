import apolloClient from "@/services/apollo-client";
import { DataStoryMetadata } from "@/types/datastories/datastories";
import { Datastory } from "@/types/datastories/datastory";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";

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
            }
          }
          sectionOverview {
            pt {
              section {
                title
                bignumbers {
                  icon
                  number
                  numberLabel
                  subtitle
                  title
                }
                dataReference {
                  title
                  date
                }
              }
            }
          }
          sections {
            ${locale} {
              section {
                id
                title
                description
                iframe {
                  source
                  classNames
                }
              }
            }
          }
          dataSource {
            ${locale} {
              id
              title
              description
              sources {
                children
                href
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
    return {} as Datastory;
  }

  return flattenData(datastory) as Datastory;
}
