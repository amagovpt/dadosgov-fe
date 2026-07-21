import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";
import { notFound } from "next/navigation";
import { FrontOfficePage, Metadata } from "@/service/types/shared/common";

export async function getFrontOfficeMetadata(
  slug: string,
  locale: string = "pt"
): Promise<Metadata> {
  const query = gql(/* GraphQL */ `
    query QueryFrontOfficeMetadata($slug: String!) {
      queryFrontOfficePagesContents(filter: $slug) {
        data {
          metadata{
            ${locale} {
              slug
              title
              image {
                fileName
                url
                id
              }
              createdAt
            }
          }
        }
      }
    }
  `);

  const { data, error } = await apolloClient.query<{
    queryFrontOfficePagesContents: Array<{
      data: Record<string, unknown>;
    }>;
  }>({
    query: query,
    variables: {
      slug: `data/id/iv eq '${slug}'`,
    },
  });

  if (!data || error) {
    console.error("Error fetching Metadata Frontofiice Page information:", error);
    throw new Error("Failed to fetch Metadata Frontofiice Page information");
  }

  const datastory = data.queryFrontOfficePagesContents[0]?.data;

  if (!datastory) {
    return {} as Metadata;
  }

  return flattenData(datastory).metadata as Metadata;
}

export async function getFrontOfficePage(slug: string, locale: string = "pt"): Promise<FrontOfficePage> {
  const query = gql(/* GraphQL */ `
    query QueryFrontOfficePage($slug: String!) {
      queryFrontOfficePagesContents(filter: $slug) {
        data {
            noResults {
                ${locale}{
                    icon
                    title
                    subtitle
                    description
                }
            }
            hero {
                ${locale}{
                    title
                    subtitle
                    description
                    highlight
                    sitemap {
                        title
                        links {
                            anchor {
                                icon
                                href
                                children
                            }
                        }
                    }
                    image {
                        url
                        id
                        slug
                    }
                }
            }
            metadata {
                ${locale}{
                    title
                    theme
                    slug
                    schemaName
                }
            }
            search {
                ${locale}{
                    label
                    placeholder
                    searchActionAltText
                    voiceActionAltText
                }
            }
        }
      }
    }
  `);

  const { data, error } = await apolloClient.query<{
    queryFrontOfficePagesContents: Array<{
      data: Record<string, unknown>;
    }>;
  }>({
    query: query,
    variables: {
      slug: `data/id/iv eq '${slug}'`,
    },
  });

  if (!data || error) {
    console.error("Error fetching FronyOffice information:", error);
    throw new Error("Failed to fetch FronyOffice information");
  }

  const datastory = data.queryFrontOfficePagesContents[0]?.data;

  if (!datastory) {
    return notFound();
  }

  return flattenData(datastory) as unknown as FrontOfficePage;
}
