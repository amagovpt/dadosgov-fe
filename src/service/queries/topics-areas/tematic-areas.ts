import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";
import { TematicAreaPage } from "@/service/types/tematic-areas";

export async function getTematicAreas(locale: string = "pt"): Promise<TematicAreaPage> {
  const query = gql(/* GraphQL */ `
        query GetTematicAreas {
            findTematicPageSingleton{
                data{
                    hero{
                        ${locale} {
                            title
                            description
                            updatedAt
                            createdAt
                        }
                    }
                    topics{
                        ${locale} {
                            data{
                                icon{
                                    iv
                                }
                                title{
                                    ${locale} 
                                }
                                description{
                                    ${locale} 
                                }
                                coverImage{
                                    iv{
                                        id
                                        url
                                        slug
                                        sourceUrl
                                    }
                                }
                                slug{
                                    iv
                                }
                                intro{
                                    ${locale} 
                                }
                            }
                        }
                    }
                }
            }
        }
  `);

  const { data, error } = await apolloClient.query<{
    findTematicPageSingleton: { data: Record<string, unknown> };
  }>({
    query: query,
  });

  if (!data || error) {
    console.error("Error fetching datastory information:", error);
    throw new Error("Failed to fetch datastory information");
  }

  const tematicAreas = data.findTematicPageSingleton?.data;

  if (!tematicAreas) {
    return {} as TematicAreaPage;
  }

  return flattenData(tematicAreas) as unknown as TematicAreaPage;
}
