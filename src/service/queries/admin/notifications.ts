import {
  BoNotificationsMetadata,
  BoNotificationsPage,
} from "@/service/types/admin/notifications";
import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";

export async function getBoNotificationsMetadata(
  locale: string = "pt"
): Promise<BoNotificationsMetadata> {
  const query = gql(/* GraphQL */ `
    query getBoNotificationsMetadata {
      findBoNotificationsSingleton {
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
    findBoNotificationsSingleton: BoNotificationsPage;
  }>({
    query,
  });

  if (!data || error) {
    console.error("Error fetching bo-notifications metadata:", error);
    throw new Error("Failed to fetch bo-notifications metadata");
  }

  return flattenData(data).findBoNotificationsSingleton as BoNotificationsMetadata;
}

export async function getBoNotifications(locale: string = "pt"): Promise<BoNotificationsPage> {
  const query = gql(/* GraphQL */ `
    query getBoNotifications {
      findBoNotificationsSingleton {
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

  const { data, error } = await apolloClient.query<{
    findBoNotificationsSingleton: BoNotificationsPage;
  }>({
    query,
  });

  if (!data || error) {
    console.error("Error fetching bo-notifications content:", error);
    throw new Error("Failed to fetch bo-notifications content");
  }

  return flattenData(data).findBoNotificationsSingleton as BoNotificationsPage;
}
