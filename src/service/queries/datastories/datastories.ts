import {
  Datastories,
  DataStoriesHero,
  DataStoriesPage,
} from "@/service/types/datastories/datastories";
import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";

export async function getDataStoriesMetadata(locale: string = "pt") {
  const query = gql(/* GraphQL */ `
    query getDataStories {
        findDataStoriesPageSingleton {
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
    findDataStoriesPageSingleton: DataStoriesPage;
  }>({
    query: query,
  });

  if (!data || error) {
    console.error("Error fetching datastories information:", error);
    throw new Error("Failed to fetch datastories information");
  }

  return flattenData(data).findDataStoriesPageSingleton as DataStoriesHero;
}

export async function getDataStories(locale: string = "pt") {
  const query = gql(/* GraphQL */ `
    query getDataStories {
        findDataStoriesPageSingleton {
            data {
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
        queryDataStoriesContents {
            data {
                metadata{
                    ${locale} {
                        slug
                        theme
                        organizationName
                        title
                        description
                        image {
                            fileName
                            url
                            id
                        }
                        createdAt
                        tags {
                            tag
                        }
                    }
                }
            }
        }
    }
  `);

  const { data, error } = await apolloClient.query<{
    findDataStoriesPageSingleton: DataStoriesPage;
    queryDataStoriesContents: Datastories;
  }>({
    query: query,
  });

  if (!data || error) {
    console.error("Error fetching datastories information:", error);
    throw new Error("Failed to fetch datastories information");
  }

  const pageContent = flattenData(data).findDataStoriesPageSingleton as DataStoriesPage;

  const datastories = Object.values(
    flattenData(data.queryDataStoriesContents as unknown as Record<string, unknown>)
  ) as Datastories;

  return { pageContent: pageContent, datastories: datastories };
}
