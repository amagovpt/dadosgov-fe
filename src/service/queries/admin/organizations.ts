import {
  BoOrganizationsMetadata,
  BoOrganizationsMetadataField,
  BoOrganizationsPage,
} from "@/service/types/admin/organizations";
import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";

export async function getBoOrganizationsMetadata(
  locale: string = "pt",
  field: BoOrganizationsMetadataField = "createMetadata"
): Promise<BoOrganizationsMetadata> {
  const query = gql(/* GraphQL */ `
    query getBoOrganizationsMetadata {
      findBoOrganizationsSingleton {
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
    findBoOrganizationsSingleton: BoOrganizationsPage;
  }>({
    query,
  });

  if (!data || error) {
    console.error("Error fetching bo-organizations metadata:", error);
    throw new Error("Failed to fetch bo-organizations metadata");
  }

  const page = flattenData(data).findBoOrganizationsSingleton as BoOrganizationsMetadata;
  if (!page) throw new Error("Bo organizations metadata is missing");
  return page;
}

export async function getBoOrganizations(
  locale: string = "pt"
): Promise<BoOrganizationsPage> {
  const query = gql(/* GraphQL */ `
    query getBoOrganizations {
      findBoOrganizationsSingleton {
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
          orgProfileHero {
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
          systemNoResults {
            ${locale} {
              icon
              title
              subtitle
              description
            }
          }
          orgProfileNoResults {
            ${locale} {
              icon
              title
              subtitle
              description
            }
          }
          orgProfileDeleteCard {
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
          steps {
            ${locale} {
              title
            }
          }
          selectionIntroduction {
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
          detailsIntroduction {
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
        }
      }
    }
  `);

  const { data, error } = await apolloClient.query<{
    findBoOrganizationsSingleton: BoOrganizationsPage;
  }>({
    query,
  });

  if (!data || error) {
    console.error("Error fetching bo-organizations content:", error);
    throw new Error("Failed to fetch bo-organizations content");
  }

  const page = flattenData(data).findBoOrganizationsSingleton as BoOrganizationsPage;
  if (!page) throw new Error("Bo organizations content is missing");
  return page;
}
