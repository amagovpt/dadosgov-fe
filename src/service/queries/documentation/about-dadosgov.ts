import type { AboutDadosGovMetadata, AboutDadosGovPage } from "@/service/types/documentation/about-dadosgov";
import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";

export async function getAboutDadosGovMetadata(
  locale: string = "pt"
): Promise<AboutDadosGovMetadata> {
  const query = gql(/* GraphQL */ `
    query GetAboutDadosGovMetadata {
      findAboutDadosgovPageSingleton {
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
    findAboutDadosgovPageSingleton?: { data?: AboutDadosGovPage };
  }>({ query });

  if (!data || error) {
    console.error("Error fetching About dados.gov.pt metadata:", error);
    throw new Error("Failed to fetch About dados.gov.pt metadata");
  }

  if (!data.findAboutDadosgovPageSingleton?.data) {
    throw new Error("About dados.gov.pt metadata is missing");
  }

  return (
    flattenData(data, locale).findAboutDadosgovPageSingleton as { metadata: AboutDadosGovMetadata }
  ).metadata;
}

export async function getAboutDadosGovPage(locale: string = "pt"): Promise<AboutDadosGovPage> {
  const query = gql(/* GraphQL */ `
    query GetAboutDadosGovPage {
      findAboutDadosgovPageSingleton {
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
    findAboutDadosgovPageSingleton?: { data?: AboutDadosGovPage };
  }>({ query });

  if (!data || error) {
    console.error("Error fetching About dados.gov.pt page:", error);
    throw new Error("Failed to fetch About dados.gov.pt page");
  }

  if (!data.findAboutDadosgovPageSingleton?.data) {
    throw new Error("About dados.gov.pt page content is missing");
  }

  return flattenData(data, locale).findAboutDadosgovPageSingleton as AboutDadosGovPage;
}
