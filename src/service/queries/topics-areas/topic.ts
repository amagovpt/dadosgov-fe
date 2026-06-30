import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";
import { Topic } from "@/service/types/tematic-areas";

export async function getDataTopics(slug: string, locale: string = "pt"): Promise<Topic | null> {
  const query = gql(/* GraphQL */ `
    query QueryGetTopicAreaData($slug: String!) {
      queryTopicPagesContents(filter: $slug) {
        data {
            title {
                ${locale}
            }
            description {
                ${locale}
            }
            slug {
                iv
            }
            intro {
                ${locale}
            }
            keywords {
                ${locale}
            }
            featuredReuses {
                iv
            }
            sections {
                ${locale} {
                    sector
                    heading
                    body
                    datasets {
                        href
                        children
                        }
                }
            }
        }
      }
    }
  `);

  const { data, error } = await apolloClient.query<{
    queryTopicPagesContents: Array<{
      data: Record<string, unknown>;
    }>;
  }>({
    query: query,
    variables: {
      slug: `data/slug/iv eq '${slug}'`,
    },
  });

  if (!data || error) {
    console.error("Error fetching datastory information:", error);
    throw new Error("Failed to fetch datastory information");
  }

  const topic = data.queryTopicPagesContents[0]?.data;

  if (!topic) {
    return null;
  }

  return flattenData(topic) as unknown as Topic;
}
