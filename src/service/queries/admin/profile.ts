import { BoProfileMetadata, BoProfilePage } from "@/service/types/admin/profile";
import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";

export async function getBoProfileMetadata(locale: string = "pt"): Promise<BoProfileMetadata> {
  const query = gql(/* GraphQL */ `
    query getBoProfileMetadata {
      findBoProfileSingleton {
        data {
          metadata {
            ${locale} {
              title
              description
            }
          }
        }
      }
    }
  `);

  const { data, error } = await apolloClient.query<{ findBoProfileSingleton: BoProfilePage }>({
    query,
  });

  if (!data || error) {
    console.error("Error fetching bo-profile metadata:", error);
    throw new Error("Failed to fetch bo-profile metadata");
  }

  return flattenData(data).findBoProfileSingleton as BoProfileMetadata;
}

export async function getBoProfile(locale: string = "pt"): Promise<BoProfilePage> {
  const query = gql(/* GraphQL */ `
    query getBoProfile {
      findBoProfileSingleton {
        data {
          metadata {
            ${locale} {
              title
              description
            }
          }
          hero {
            ${locale} {
              title
              description
            }
          }
          followingsNoResults {
            ${locale} {
              icon
              title
              subtitle
              description
            }
          }
          deleteAvatarCard {
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

  const { data, error } = await apolloClient.query<{ findBoProfileSingleton: BoProfilePage }>({
    query,
  });

  if (!data || error) {
    console.error("Error fetching bo-profile content:", error);
    throw new Error("Failed to fetch bo-profile content");
  }

  return flattenData(data).findBoProfileSingleton as BoProfilePage;
}
