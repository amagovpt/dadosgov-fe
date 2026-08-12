import {
  BoUsersMetadata,
  BoUsersMetadataField,
  BoUsersPage,
} from "@/service/types/admin/users";
import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";

export async function getBoUsersMetadata(
  locale: string = "pt",
  field: BoUsersMetadataField = "systemMetadata"
): Promise<BoUsersMetadata> {
  const query = gql(/* GraphQL */ `
    query getBoUsersMetadata {
      findBoUsersSingleton {
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

  const { data, error } = await apolloClient.query<{ findBoUsersSingleton: BoUsersPage }>({
    query,
  });

  if (!data || error) {
    console.error("Error fetching bo-users metadata:", error);
    throw new Error("Failed to fetch bo-users metadata");
  }

  const page = flattenData(data).findBoUsersSingleton as BoUsersMetadata;
  if (!page) throw new Error("Bo users metadata is missing");
  return page;
}

export async function getBoUsers(locale: string = "pt"): Promise<BoUsersPage> {
  const query = gql(/* GraphQL */ `
    query getBoUsers {
      findBoUsersSingleton {
        data {
          systemMetadata {
            ${locale} {
              title
              description
            }
          }
          profileMetadata {
            ${locale} {
              title
              description
            }
          }
          systemHero {
            ${locale} {
              title
              description
            }
          }
          profileHero {
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
          followingsNoResults {
            ${locale} {
              icon
              title
              subtitle
              description
            }
          }
          subscriptionsNoResults {
            ${locale} {
              icon
              title
              subtitle
              description
            }
          }
          activitiesNoResults {
            ${locale} {
              icon
              title
              subtitle
              description
            }
          }
          activateCard {
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
          deactivateCard {
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
        }
      }
    }
  `);

  const { data, error } = await apolloClient.query<{ findBoUsersSingleton: BoUsersPage }>({
    query,
  });

  if (!data || error) {
    console.error("Error fetching bo-users content:", error);
    throw new Error("Failed to fetch bo-users content");
  }

  const page = flattenData(data).findBoUsersSingleton as BoUsersPage;
  if (!page) throw new Error("Bo users content is missing");
  return page;
}
