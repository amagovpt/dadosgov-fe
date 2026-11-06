import { DatastorySearchPage } from "@/service/types/datastories/pt2030/pt2030";
import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";
import { notFound } from "next/navigation";

export async function getDatastorySearchPage(
  slug: string,
  locale: string = "pt"
): Promise<DatastorySearchPage> {
  const query = gql(/* GraphQL */ `
    query QueryGetDataStoriesSearchPageData($slug: String!) {
      querySearchPagesEuropeanFundsContents(filter: $slug) {
        data {
          id {
            iv
          }
          hero {
            ${locale} {
              title
              description
              index {
                title
                anchors {
                  anchor {
                    href
                    children
                    icon
                  }
                }
              }
              breadcrumbs {
                url
                label
              }
            }
          }
          bigNumberTitle{
            ${locale}
          }
          bigNumbers {
            ${locale} {
              description
            }
          }
          block {
            ${locale} {
              title
              description
            }
          }
          inputSearch {
            ${locale} {
              label
              placeholder
              searchActionAltText
              voiceActionAltText
            }
          }
          typesOfBeneficiariesTitle {
            ${locale}
          }
          typesOfBeneficiaries {
            ${locale} {
              name
              title
              description
            }
          }
          filters {
            ${locale} {
              name
              label
            }
          }
          sortBy {
            ${locale} {
              name
              label
            }
          }
          noResults {
            ${locale} {
              image {
                url
              }
              title
              description
            }
          }
          relatedDatasets {
            ${locale} {
                  schemaName
                  id
                  active
                  title
                  datasets {
                    image {
                      url
                    }
                    createdAt
                    organizationName
                    title
                    description
                    slug
                  }
                }
          }
          relatedDatastories {
            ${locale} {
                 schemaName
                 id
                 active
                 title
                 description
                 datastories {
                   data {
                     metadata {
                       ${locale} {
                         createdAt
                         description
                         slug
                         title
                       }
                     }
                   }
                 }
              }
            }
        }
      }
    }
  `);

  const { data, error } = await apolloClient.query<{
    querySearchPagesEuropeanFundsContents: Array<{
      data: Record<string, unknown>;
    }>;
  }>({
    query: query,
    variables: {
      slug: `data/id/iv eq '${slug}'`,
    },
  });

  if (!data || error) {
    console.error("Error fetching datastory information:", error);
    throw new Error("Failed to fetch datastory information");
  }

  const datastory = data.querySearchPagesEuropeanFundsContents[0]?.data;

  if (!datastory) {
    return notFound();
  }

  const dataFlatten = flattenData(datastory) as DatastorySearchPage;

  return dataFlatten;
}
