import { BoEditorialMetadata, BoEditorialPage } from "@/service/types/admin/editorial";
import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";

export async function getBoEditorialMetadata(locale: string = "pt"): Promise<BoEditorialMetadata> {
  const query = gql(/* GraphQL */ `
    query getBoEditorialMetadata {
      findBoEditorialSingleton {
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
    findBoEditorialSingleton: BoEditorialPage;
  }>({
    query,
  });

  if (!data || error) {
    console.error("Error fetching bo-editorial metadata:", error);
    throw new Error("Failed to fetch bo-editorial metadata");
  }

  return flattenData(data).findBoEditorialSingleton as BoEditorialMetadata;
}

export async function getBoEditorial(locale: string = "pt"): Promise<BoEditorialPage> {
  const query = gql(/* GraphQL */ `
    query getBoEditorial {
      findBoEditorialSingleton {
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
        }
      }
    }
  `);

  const { data, error } = await apolloClient.query<{
    findBoEditorialSingleton: BoEditorialPage;
  }>({
    query,
  });

  if (!data || error) {
    console.error("Error fetching bo-editorial content:", error);
    throw new Error("Failed to fetch bo-editorial content");
  }

  return flattenData(data).findBoEditorialSingleton as BoEditorialPage;
}
