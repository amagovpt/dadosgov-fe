import { DatasetsPage } from "@/service/types/datasets/datasets";
import { FoListPageHero } from "@/service/types/shared";
import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";

export async function getDatasetsMetadata(locale: string = "pt") {
  const query = gql(/* GraphQL */ `
    query getDatasets {
        findDatasetsPageSingleton {
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
    findDatasetsPageSingleton: DatasetsPage;
  }>({
    query: query,
  });

  if (!data || error) {
    console.error("Error fetching datasets information:", error);
    throw new Error("Failed to fetch datasets information");
  }

  return flattenData(data).findDatasetsPageSingleton as FoListPageHero;
}

export async function getDatasets(locale: string = "pt") {
  const query = gql(/* GraphQL */ `
    query getDatasets {
        findDatasetsPageSingleton {
            data {
                hero {
                    ${locale} {
                        title
                        description
                    }
                }
                search {
                    ${locale} {
                        placeholder
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

  const { data, error } = await apolloClient.query<{
    findDatasetsPageSingleton: DatasetsPage;
  }>({
    query: query,
  });

  if (!data || error) {
    console.error("Error fetching datasets information:", error);
    throw new Error("Failed to fetch datasets information");
  }

  const pageContent = flattenData(data).findDatasetsPageSingleton as DatasetsPage;

  return { pageContent: pageContent };
}
