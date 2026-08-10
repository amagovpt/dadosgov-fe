import {
  BoReusesMetadata,
  BoReusesMetadataField,
  BoReusesPage,
} from "@/service/types/admin/reuses";
import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";

export async function getBoReusesMetadata(
  locale: string = "pt",
  field: BoReusesMetadataField = "createMetadata"
): Promise<BoReusesMetadata> {
  const query = gql(/* GraphQL */ `
    query getBoReusesMetadata {
      findBoReusesSingleton {
        data {
          ${field} {
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

  const page = flattenData(data).findBoReusesSingleton as BoReusesMetadata;
  if (!page) throw new Error("Bo reuses metadata is missing");
  return page;
}

export async function getBoReuses(locale: string = "pt"): Promise<BoReusesPage> {
  const query = gql(/* GraphQL */ `
    query getBoReuses {
      findBoReusesSingleton {
        data {
          createMetadata {
            ${locale} {
              title
              description
            }
          }
          createHero {
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
          archiveCard {
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
          unarchiveCard {
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
          deleteCard {
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
          visibilityCard {
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

  const page = flattenData(data).findBoReusesSingleton as BoReusesPage;
  if (!page) throw new Error("Bo reuses content is missing");
  return page;
}
