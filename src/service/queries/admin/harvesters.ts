import {
  BoHarvestersMetadata,
  BoHarvestersPage,
} from "@/service/types/admin/harvesters";
import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";

export async function getBoHarvestersMetadata(
  locale: string = "pt"
): Promise<BoHarvestersMetadata> {
  const query = gql(/* GraphQL */ `
    query getBoHarvestersMetadata {
      findBoHarvestersSingleton {
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
    findBoHarvestersSingleton: BoHarvestersPage;
  }>({
    query,
  });

  if (!data || error) {
    console.error("Error fetching bo-harvesters metadata:", error);
    throw new Error("Failed to fetch bo-harvesters metadata");
  }

  return flattenData(data).findBoHarvestersSingleton as BoHarvestersMetadata;
}

export async function getBoHarvesters(
  locale: string = "pt"
): Promise<BoHarvestersPage> {
  const query = gql(/* GraphQL */ `
    query getBoHarvesters {
      findBoHarvestersSingleton {
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
          acceptedStatusInfo {
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
          pendingAdminCard {
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
          pendingOwnerCard {
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
          createdPendingCard {
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
    findBoHarvestersSingleton: BoHarvestersPage;
  }>({
    query,
  });

  if (!data || error) {
    console.error("Error fetching bo-harvesters content:", error);
    throw new Error("Failed to fetch bo-harvesters content");
  }

  return flattenData(data).findBoHarvestersSingleton as BoHarvestersPage;
}
