import type { ApiReferencePage } from "@/service/types/documentation/api-reference";
import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";

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
          swaggerSpecUrl {
            ${locale}
          }
        }
      }
    }
  `);

  const { data, error } = await apolloClient.query<{
    findApiReferencePageSingleton?: { data?: Record<string, unknown> };
  }>({ query });

  if (!data || error) {
    console.error("Error fetching API reference page:", error);
    throw new Error("Failed to fetch API reference page");
  }

  const page = data.findApiReferencePageSingleton?.data;
  if (!page) {
    throw new Error("API reference page content is missing");
  }

  return flattenData(page, [locale, "pt", "en"]) as unknown as ApiReferencePage;
}
