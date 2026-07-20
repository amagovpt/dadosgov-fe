import { BoReusesMetadata, BoReusesPage } from "@/service/types/admin/reuses";
import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";

export async function getBoReusesMetadata(locale: string = "pt"): Promise<BoReusesMetadata> {
  const query = gql(/* GraphQL */ `
    query getBoReusesMetadata {
      findBoReusesSingleton {
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
    findBoReusesSingleton: BoReusesPage;
  }>({
    query,
  });

  if (!data || error) {
    console.error("Error fetching bo-reuses metadata:", error);
    throw new Error("Failed to fetch bo-reuses metadata");
  }

  return flattenData(data).findBoReusesSingleton as BoReusesMetadata;
}

export async function getBoReuses(locale: string = "pt"): Promise<BoReusesPage> {
  const query = gql(/* GraphQL */ `
    query getBoReuses {
      findBoReusesSingleton {
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
          search {
            ${locale} {
              label
              placeholder
              hint
            }
          }
          myNoResults {
            ${locale} {
              icon
              title
              subtitle
              description
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
          orgSteps {
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
          datasetAssociationInfo {
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
          datasetAssociationWarning {
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
    findBoReusesSingleton: BoReusesPage;
  }>({
    query,
  });

  if (!data || error) {
    console.error("Error fetching bo-reuses content:", error);
    throw new Error("Failed to fetch bo-reuses content");
  }

  return flattenData(data).findBoReusesSingleton as BoReusesPage;
}
