import {
  BoCommunityResourcesMetadata,
  BoCommunityResourcesPage,
} from "@/service/types/admin/community-resources";
import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";

export async function getBoCommunityResourcesMetadata(
  locale: string = "pt"
): Promise<BoCommunityResourcesMetadata> {
  const query = gql(/* GraphQL */ `
    query getBoCommunityResourcesMetadata {
      findBoCommunityResourcesSingleton {
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

  const { data, error } = await apolloClient.query<{
    findBoCommunityResourcesSingleton: BoCommunityResourcesPage;
  }>({
    query,
  });

  if (!data || error) {
    console.error("Error fetching bo-community-resources metadata:", error);
    throw new Error("Failed to fetch bo-community-resources metadata");
  }

  return flattenData(data)
    .findBoCommunityResourcesSingleton as BoCommunityResourcesMetadata;
}

export async function getBoCommunityResources(
  locale: string = "pt"
): Promise<BoCommunityResourcesPage> {
  const query = gql(/* GraphQL */ `
    query getBoCommunityResources {
      findBoCommunityResourcesSingleton {
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
          introduction {
            ${locale} {
              title
              description {
                html
              }
              anchor {
                href
                children
              }
            }
          }
          producerHelper {
            ${locale} {
              title
              description {
                html
              }
              anchor {
                href
                children
              }
            }
          }
          createdCard {
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
          createAuxiliaryItems {
            ${locale} {
              enabled
              title
              description {
                html
              }
              anchor {
                href
                children
              }
            }
          }
          editAuxiliaryItems {
            ${locale} {
              enabled
              title
              description {
                html
              }
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
    findBoCommunityResourcesSingleton: BoCommunityResourcesPage;
  }>({
    query,
  });

  if (!data || error) {
    console.error("Error fetching bo-community-resources content:", error);
    throw new Error("Failed to fetch bo-community-resources content");
  }

  return flattenData(data).findBoCommunityResourcesSingleton as BoCommunityResourcesPage;
}
