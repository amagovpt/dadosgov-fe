import apolloClient from "@/services/apollo-client";
import { Home } from "@/service/types/home";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";

export async function getHome(locale: string = "pt"): Promise<Home> {
  const query = gql(/* GraphQL */ `
        query GetHome {
        findHomeSingleton {
            data {
                datastories {
                    ${locale} {
                        data {
                            metadata {
                                ${locale} {
                                    title
                                    slug
                                    image {
                                        fileName
                                        url
                                        id
                                        slug
                                    }
                                    createdAt
                                    }
                                }
                            }
                        
                    }
                }
                usedDailyBy {
                    iv {
                      data {
                        alt {
                          ${locale}
                        }
                        anchor {
                          iv {
                            children
                            href
                          }
                        }
                        logo {
                          iv {
                            id
                            url
                            slug
                            fileName
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
    findHomeSingleton: { data: Record<string, unknown> };
  }>({
    query: query,
  });

  if (!data || error) {
    console.error("Error fetching datastory information:", error);
    throw new Error("Failed to fetch datastory information");
  }

  const homeData = data.findHomeSingleton?.data;

  if (!homeData) {
    return {} as Home;
  }

  return flattenData(homeData) as Home;
}
