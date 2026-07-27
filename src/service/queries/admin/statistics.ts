import {
  BoStatisticsMetadata,
  BoStatisticsMetadataField,
  BoStatisticsPage,
} from "@/service/types/admin/statistics";
import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";

export async function getBoStatisticsMetadata(
  locale: string = "pt",
  field: BoStatisticsMetadataField = "userMetadata"
): Promise<BoStatisticsMetadata> {
  const query = gql(/* GraphQL */ `
    query getBoStatisticsMetadata {
      findBoStatisticsSingleton {
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
    findBoStatisticsSingleton: BoStatisticsPage;
  }>({
    query,
  });

  if (!data || error) {
    console.error("Error fetching bo-statistics metadata:", error);
    throw new Error("Failed to fetch bo-statistics metadata");
  }

  return flattenData(data).findBoStatisticsSingleton as BoStatisticsMetadata;
}

export async function getBoStatistics(locale: string = "pt"): Promise<BoStatisticsPage> {
  const query = gql(/* GraphQL */ `
    query getBoStatistics {
      findBoStatisticsSingleton {
        data {
          userMetadata {
            ${locale} {
              title
              description
            }
          }
          orgRedirectMetadata {
            ${locale} {
              title
              description
            }
          }
          orgMetadata {
            ${locale} {
              title
              description
            }
          }
          userHero {
            ${locale} {
              title
              description
            }
          }
          orgHero {
            ${locale} {
              title
              description
            }
          }
          userSummaryCards {
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
          orgSummaryCards {
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
          datasetsSearch {
            ${locale} {
              label
              placeholder
              hint
            }
          }
          dataservicesSearch {
            ${locale} {
              label
              placeholder
              hint
            }
          }
          reusesSearch {
            ${locale} {
              label
              placeholder
              hint
            }
          }
          datasetsNoResults {
            ${locale} {
              icon
              title
              subtitle
              description
            }
          }
          dataservicesNoResults {
            ${locale} {
              icon
              title
              subtitle
              description
            }
          }
          reusesNoResults {
            ${locale} {
              icon
              title
              subtitle
              description
            }
          }
          noOrganizations {
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
    findBoStatisticsSingleton: BoStatisticsPage;
  }>({
    query,
  });

  if (!data || error) {
    console.error("Error fetching bo-statistics content:", error);
    throw new Error("Failed to fetch bo-statistics content");
  }

  return flattenData(data).findBoStatisticsSingleton as BoStatisticsPage;
}
