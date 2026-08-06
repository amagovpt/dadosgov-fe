import type { AboutOpenDataMetadata, AboutOpenDataPage } from "@/service/types/documentation/about-open-data";
import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";

export async function getAboutOpenDataMetadata(
  locale: string = "pt"
): Promise<AboutOpenDataMetadata> {
  const query = gql(/* GraphQL */ `
    query GetAboutOpenDataMetadata {
      findAboutOpenDataPageSingleton {
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
    findAboutOpenDataPageSingleton?: { data?: AboutOpenDataPage };
  }>({ query });

  if (!data || error) {
    console.error("Error fetching About open data metadata:", error);
    throw new Error("Failed to fetch About open data metadata");
  }

  if (!data.findAboutOpenDataPageSingleton?.data) {
    throw new Error("About open data metadata is missing");
  }

  return flattenData(data, locale).findAboutOpenDataPageSingleton as AboutOpenDataMetadata;
}

export async function getAboutOpenDataPage(locale: string = "pt"): Promise<AboutOpenDataPage> {
  const query = gql(/* GraphQL */ `
    query GetAboutOpenDataPage {
      findAboutOpenDataPageSingleton {
        data {
          metadata {
            ${locale} {
              title
              description
            }
          }
          content {
            ${locale} {
              markdown
            }
          }
        }
      }
    }
  `);

  const { data, error } = await apolloClient.query<{
    findAboutOpenDataPageSingleton?: { data?: AboutOpenDataPage };
  }>({ query });

  if (!data || error) {
    console.error("Error fetching About open data page:", error);
    throw new Error("Failed to fetch About open data page");
  }

  if (!data.findAboutOpenDataPageSingleton?.data) {
    throw new Error("About open data page content is missing");
  }

  return flattenData(data, locale).findAboutOpenDataPageSingleton as AboutOpenDataPage;
}
