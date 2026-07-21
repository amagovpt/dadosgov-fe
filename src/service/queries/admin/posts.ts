import {
  BoPostsMetadata,
  BoPostsMetadataField,
  BoPostsPage,
} from "@/service/types/admin/posts";
import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";

export async function getBoPostsMetadata(
  locale: string = "pt",
  field: BoPostsMetadataField = "systemMetadata"
): Promise<BoPostsMetadata> {
  const query = gql(/* GraphQL */ `
    query getBoPostsMetadata {
      findBoPostsSingleton {
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
    findBoPostsSingleton: BoPostsPage;
  }>({
    query,
  });

  if (!data || error) {
    console.error("Error fetching bo-posts metadata:", error);
    throw new Error("Failed to fetch bo-posts metadata");
  }

  return flattenData(data).findBoPostsSingleton as BoPostsMetadata;
}

export async function getBoPosts(locale: string = "pt"): Promise<BoPostsPage> {
  const query = gql(/* GraphQL */ `
    query getBoPosts {
      findBoPostsSingleton {
        data {
          systemMetadata {
            ${locale} {
              title
              description
            }
          }
          createMetadata {
            ${locale} {
              title
              description
            }
          }
          editMetadata {
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
          createHero {
            ${locale} {
              title
              description
            }
          }
          search {
            ${locale} {
              label
              placeholder
              hint
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
          steps {
            ${locale} {
              title
            }
          }
          unpublishCard {
            ${locale} {
              icon
              title
              subtitle
              description
              anchor {
                href
                children
              }
            }
          }
          deleteCard {
            ${locale} {
              icon
              title
              subtitle
              description
              anchor {
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
    findBoPostsSingleton: BoPostsPage;
  }>({
    query,
  });

  if (!data || error) {
    console.error("Error fetching bo-posts content:", error);
    throw new Error("Failed to fetch bo-posts content");
  }

  return flattenData(data).findBoPostsSingleton as BoPostsPage;
}
