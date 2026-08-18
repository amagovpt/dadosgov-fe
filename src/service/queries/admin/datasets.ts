import {
  BoDatasetsMetadata,
  BoDatasetsMetadataField,
  BoDatasetsPage,
} from "@/service/types/admin/datasets";
import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";

export async function getBoDatasetsMetadata(
  locale: string = "pt",
  field: BoDatasetsMetadataField = "createMetadata"
): Promise<BoDatasetsMetadata> {
  const query = gql(/* GraphQL */ `
    query getBoDatasetsMetadata {
      findBoDatasetsSingleton {
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
    findBoDatasetsSingleton: BoDatasetsPage;
  }>({
    query,
  });

  if (!data || error) {
    console.error("Error fetching bo-datasets metadata:", error);
    throw new Error("Failed to fetch bo-datasets metadata");
  }

  const page = flattenData(data).findBoDatasetsSingleton as BoDatasetsMetadata;
  if (!page) throw new Error("Bo datasets metadata is missing");
  return page;
}

export async function getBoDatasets(locale: string = "pt"): Promise<BoDatasetsPage> {
  const query = gql(/* GraphQL */ `
    query getBoDatasets {
      findBoDatasetsSingleton {
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
          publicationEntry {
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
          publicationIntroduction {
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
          resourceIntroduction {
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
          publishStepCard {
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
          transferCard {
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
          resourceAuxiliaryItems {
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
    findBoDatasetsSingleton: BoDatasetsPage;
  }>({
    query,
  });

  if (!data || error) {
    console.error("Error fetching bo-datasets content:", error);
    throw new Error("Failed to fetch bo-datasets content");
  }

  const page = flattenData(data).findBoDatasetsSingleton as BoDatasetsPage;
  if (!page) throw new Error("Bo datasets content is missing");
  return page;
}
