import {
  BoDiscussionsMetadata,
  BoDiscussionsMetadataField,
  BoDiscussionsPage,
} from "@/service/types/admin/discussions";
import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";

export async function getBoDiscussionsMetadata(
  locale: string = "pt",
  field: BoDiscussionsMetadataField = "orgMetadata"
): Promise<BoDiscussionsMetadata> {
  const query = gql(/* GraphQL */ `
    query getBoDiscussionsMetadata {
      findBoDiscussionsSingleton {
        data {
          ${field} {
            ${locale} {
              title
              description
            }
          }
        }
      }
    }
  `);

  const { data, error } = await apolloClient.query<{
    findBoDiscussionsSingleton: BoDiscussionsPage;
  }>({
    query,
  });

  if (!data || error) {
    console.error("Error fetching bo-discussions metadata:", error);
    throw new Error("Failed to fetch bo-discussions metadata");
  }

  const page = flattenData(data).findBoDiscussionsSingleton as BoDiscussionsMetadata;
  if (!page) throw new Error("Bo discussions metadata is missing");
  return page;
}

export async function getBoDiscussions(locale: string = "pt"): Promise<BoDiscussionsPage> {
  const query = gql(/* GraphQL */ `
    query getBoDiscussions {
      findBoDiscussionsSingleton {
        data {
          redirectMetadata {
            ${locale} {
              title
              description
            }
          }
          orgMetadata {
            ${locale} {
              title
              description
            }
          }
          orgHero {
            ${locale} {
              title
              description
            }
          }
          orgNoResults {
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

  const { data, error } = await apolloClient.query<{
    findBoDiscussionsSingleton: BoDiscussionsPage;
  }>({
    query,
  });

  if (!data || error) {
    console.error("Error fetching bo-discussions content:", error);
    throw new Error("Failed to fetch bo-discussions content");
  }

  const page = flattenData(data).findBoDiscussionsSingleton as BoDiscussionsPage;
  if (!page) throw new Error("Bo discussions content is missing");
  return page;
}
