import {
  BoDataservicesMetadata,
  BoDataservicesPage,
} from "@/service/types/admin/dataservices";
import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";

export async function getBoDataservicesMetadata(
  locale: string = "pt"
): Promise<BoDataservicesMetadata> {
  const query = gql(/* GraphQL */ `
    query getBoDataservicesMetadata {
      findBoDataservicesSingleton {
        data {
          hero {
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
    findBoDataservicesSingleton: BoDataservicesPage;
  }>({
    query,
  });

  if (!data || error) {
    console.error("Error fetching bo-dataservices metadata:", error);
    throw new Error("Failed to fetch bo-dataservices metadata");
  }

  return flattenData(data).findBoDataservicesSingleton as BoDataservicesMetadata;
}

export async function getBoDataservices(
  locale: string = "pt"
): Promise<BoDataservicesPage> {
  const query = gql(/* GraphQL */ `
    query getBoDataservices {
      findBoDataservicesSingleton {
        data {
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
          datasetLinksInfo {
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
          draftVisibilityCard {
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
          archiveInfoCard {
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
    findBoDataservicesSingleton: BoDataservicesPage;
  }>({
    query,
  });

  if (!data || error) {
    console.error("Error fetching bo-dataservices content:", error);
    throw new Error("Failed to fetch bo-dataservices content");
  }

  return flattenData(data).findBoDataservicesSingleton as BoDataservicesPage;
}
