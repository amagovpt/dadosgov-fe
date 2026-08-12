import { BoLogsMetadata, BoLogsPage } from "@/service/types/admin/logs";
import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";

export async function getBoLogsMetadata(locale: string = "pt"): Promise<BoLogsMetadata> {
  const query = gql(/* GraphQL */ `
    query getBoLogsMetadata {
      findBoLogsSingleton {
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

  const { data, error } = await apolloClient.query<{ findBoLogsSingleton: BoLogsPage }>({
    query,
  });

  if (!data || error) {
    console.error("Error fetching bo-logs metadata:", error);
    throw new Error("Failed to fetch bo-logs metadata");
  }

  const page = flattenData(data).findBoLogsSingleton as BoLogsMetadata;
  if (!page) throw new Error("Bo logs metadata is missing");
  return page;
}

export async function getBoLogs(locale: string = "pt"): Promise<BoLogsPage> {
  const query = gql(/* GraphQL */ `
    query getBoLogs {
      findBoLogsSingleton {
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
          intro {
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
          noResults {
            ${locale} {
              icon
              title
              subtitle
              description
            }
          }
        }
      }
    }
  `);

  const { data, error } = await apolloClient.query<{ findBoLogsSingleton: BoLogsPage }>({
    query,
  });

  if (!data || error) {
    console.error("Error fetching bo-logs content:", error);
    throw new Error("Failed to fetch bo-logs content");
  }

  const page = flattenData(data).findBoLogsSingleton as BoLogsPage;
  if (!page) throw new Error("Bo logs content is missing");
  return page;
}
