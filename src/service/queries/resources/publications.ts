import { PublicationPage } from "@/service/types/resources/publications";
import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";

export async function getPublicationsPage(locale: string = "pt"): Promise<PublicationPage> {
  const query = gql(/* GraphQL */ `
        query getPublicationsPage {
            findPublicationsPageSingleton {
                data {
                    hero {
                        ${locale} {
                            title
                            description
                        }
                    }
                    publications {
                        ${locale} {
                            data {
                                metaDetails {
                                    ${locale} {
                                        id
                                        title
                                        description
                                        updatedAt
                                    }
                                }
                                cover {
                                    iv {
                                        id
                                        url
                                        fileName
                                        slug
                                    }
                                }
                                document {
                                    iv {
                                        id
                                        url
                                        fileName
                                        slug
                                        fileSize
                                        fileType
                                        metadataText
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
    findPublicationsPageSingleton: { data: Record<string, unknown> };
  }>({
    query: query,
  });

  if (!data || error) {
    console.error("Error fetching datastory information:", error);
    throw new Error("Failed to fetch datastory information");
  }

  const publicationPage = data.findPublicationsPageSingleton?.data;

  if (!publicationPage) {
    return {} as PublicationPage;
  }

  return flattenData(publicationPage) as unknown as PublicationPage;
}
