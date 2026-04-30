import apolloClient from "@/services/apollo-client";
import { Datastory } from "@/types/datastories/datastory";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";

export async function getDatastory(slug: string, locale: string = "pt"): Promise<Datastory> {
  const query = gql(/* GraphQL */ `
    query QueryPublicDataModal($slug: String!) {
      queryDataStoriesContents(filter: $slug) {
        data {
          hero {
            ${locale} {
              title
              description
              cards {
                card {
                  icon
                  title
                  subtitle
                  bignumber {
                    number
                    description
                  }
                  anchor {
                    children
                    href
                  }
                }
              }
              dateReference {
                title
                date
              }
            }
          }
          sections {
            ${locale} {
              section {
                title
                description
                iframeSource
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
