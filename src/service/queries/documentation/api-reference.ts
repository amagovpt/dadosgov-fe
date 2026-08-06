import type { ApiReferenceMetadata, ApiReferencePage } from "@/service/types/documentation/api-reference";
import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";

export async function getApiReferenceMetadata(
  locale: string = "pt"
): Promise<ApiReferenceMetadata> {
  const query = gql(/* GraphQL */ `
    query GetApiReferenceMetadata {
      findApiReferencePageSingleton {
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
    findApiReferencePageSingleton?: { data?: ApiReferencePage };
  }>({ query });

  if (!data || error) {
    console.error("Error fetching API reference metadata:", error);
    throw new Error("Failed to fetch API reference metadata");
  }

  if (!data.findApiReferencePageSingleton?.data) {
    throw new Error("API reference metadata is missing");
  }

  return flattenData(data, locale).findApiReferencePageSingleton as ApiReferenceMetadata;
}

export async function getApiReferencePage(locale: string = "pt"): Promise<ApiReferencePage> {
  const query = gql(/* GraphQL */ `
    query GetApiReferencePage {
      findApiReferencePageSingleton {
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
          sections {
            ${locale} {
              id
              title
              enabled
              content {
                markdown
              }
            }
          }
        }
      }
    }
  `);

  const { data, error } = await apolloClient.query<{
    findApiReferencePageSingleton?: { data?: ApiReferencePage };
  }>({ query });

  if (!data || error) {
    console.error("Error fetching API reference page:", error);
    throw new Error("Failed to fetch API reference page");
  }

  if (!data.findApiReferencePageSingleton?.data) {
    throw new Error("API reference page content is missing");
  }

  return flattenData(data, locale).findApiReferencePageSingleton as ApiReferencePage;
}
