import {
  BoHarvestersMetadata,
  BoHarvestersMetadataField,
  BoHarvestersPage,
} from "@/service/types/admin/harvesters";
import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";

export async function getBoHarvestersMetadata(
  locale: string = "pt",
  field: BoHarvestersMetadataField = "createMetadata"
): Promise<BoHarvestersMetadata> {
  const query = gql(/* GraphQL */ `
    query getBoHarvestersMetadata {
      findBoHarvestersSingleton {
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
    findBoHarvestersSingleton: BoHarvestersPage;
  }>({
    query,
  });

  if (!data || error) {
    console.error("Error fetching bo-harvesters metadata:", error);
    throw new Error("Failed to fetch bo-harvesters metadata");
  }

  const page = flattenData(data).findBoHarvestersSingleton as BoHarvestersMetadata;
  if (!page) throw new Error("Bo harvesters metadata is missing");
  return page;
}

export async function getBoHarvesters(
  locale: string = "pt"
): Promise<BoHarvestersPage> {
  const query = gql(/* GraphQL */ `
    query getBoHarvesters {
      findBoHarvestersSingleton {
        data {
          createMetadata {
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
          orgNoResults {
            ${locale} {
              icon
              title
              subtitle
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
          steps {
            ${locale} {
              title
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

  const page = flattenData(data).findBoHarvestersSingleton as BoHarvestersPage;
  if (!page) throw new Error("Bo harvesters content is missing");
  return page;
}
