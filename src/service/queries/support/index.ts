import type { SupportMetadata, SupportPageContent } from "@/service/types/support";
import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";

export async function getSupportPageMetadata(locale: string = "pt"): Promise<SupportMetadata> {
  const query = gql(/* GraphQL */ `
    query getSupportPageMetadata {
      findSupportPageSingleton {
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
    findSupportPageSingleton: { data: Pick<SupportPageContent, "metadata"> };
  }>({
    query,
  });

  if (!data || error) {
    console.error("Error fetching support page metadata:", error);
    throw new Error("Failed to fetch support page metadata");
  }

  if (!data.findSupportPageSingleton?.data) {
    throw new Error("Support page metadata is missing");
  }

  return flattenData(data, locale).findSupportPageSingleton as SupportMetadata;
}

export async function getSupportPage(locale: string = "pt"): Promise<SupportPageContent> {
  const query = gql(/* GraphQL */ `
    query getSupportPage {
      findSupportPageSingleton {
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
              highlight
              description
            }
          }
          faqUpdatedDate {
            ${locale}
          }
          faqSections {
            ${locale} {
              id
              title
              enabled
              items {
                title
                description {
                  html
                }
                enabled
              }
            }
          }
          helpCard {
            ${locale} {
              id
              icon
              title
              subtitle
              description
              anchor {
                children
                href
                icon
              }
            }
          }
          questionInfoCard {
            ${locale} {
              id
              icon
              title
              subtitle
              description
              anchor {
                children
                href
                icon
              }
            }
          }
          feedbackInfoCard {
            ${locale} {
              id
              icon
              title
              subtitle
              description
              anchor {
                children
                href
                icon
              }
            }
          }
          datasetRequestCards {
            ${locale} {
              id
              icon
              title
              subtitle
              description
              anchor {
                children
                href
                icon
              }
            }
          }
        }
      }
    }
  `);

  const { data, error } = await apolloClient.query<{
    findSupportPageSingleton: { data: SupportPageContent };
  }>({
    query,
  });

  if (!data || error) {
    console.error("Error fetching support page content:", error);
    throw new Error("Failed to fetch support page content");
  }

  if (!data.findSupportPageSingleton?.data) {
    throw new Error("Support page content is missing");
  }

  return flattenData(data, locale).findSupportPageSingleton as SupportPageContent;
}
