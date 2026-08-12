import { BoTopicsMetadata, BoTopicsPage } from "@/service/types/admin/topics";
import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";

export async function getBoTopicsMetadata(locale: string = "pt"): Promise<BoTopicsMetadata> {
  const query = gql(/* GraphQL */ `
    query getBoTopicsMetadata {
      findBoTopicsSingleton {
        data {
          systemMetadata {
            ${locale} {
              title
              description
            }
          }
        }
      }
    }
  `);

  const { data, error } = await apolloClient.query<{ findBoTopicsSingleton: BoTopicsPage }>({
    query,
  });

  if (!data || error) {
    console.error("Error fetching bo-topics metadata:", error);
    throw new Error("Failed to fetch bo-topics metadata");
  }

  const page = flattenData(data).findBoTopicsSingleton as BoTopicsMetadata;
  if (!page) throw new Error("Bo topics metadata is missing");
  return page;
}

export async function getBoTopics(locale: string = "pt"): Promise<BoTopicsPage> {
  const query = gql(/* GraphQL */ `
    query getBoTopics {
      findBoTopicsSingleton {
        data {
          systemMetadata {
            ${locale} {
              title
              description
            }
          }
          systemHero {
            ${locale} {
              title
              description
            }
          }
          systemNoResults {
            ${locale} {
              icon
              title
              subtitle
              description
            }
          }
        }
      }
    }
  `);

  const { data, error } = await apolloClient.query<{ findBoTopicsSingleton: BoTopicsPage }>({
    query,
  });

  if (!data || error) {
    console.error("Error fetching bo-topics content:", error);
    throw new Error("Failed to fetch bo-topics content");
  }

  const page = flattenData(data).findBoTopicsSingleton as BoTopicsPage;
  if (!page) throw new Error("Bo topics content is missing");
  return page;
}
