import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";
import { Footer } from "../types/header/footer";

export async function getFooter(locale: string = "pt"): Promise<Footer> {
  const query = gql(/* GraphQL */ `
    query GetFooter {
        findFooterSingleton {
            data {
                title {
                    ${locale}
                }
                groups {
                    ${locale} {
                        label
                        enabled
                        cards {
                            title
                            href
                            enabled
                        }
                    }
                }
                description {
                    ${locale}
                }
                logos {
                    ${locale} {
                        icon
                        alt
                    }
                }
                social {
                    iv {
                        icon
                        href
                        alt
                    }
                }
                related {
                    ${locale} {
                        children
                        href
                    }
                }
                copyright {
                    ${locale}
                }
            }
        }
    }
  `);

  const { data, error } = await apolloClient.query<{
    findFooterSingleton: { data: Record<string, unknown> };
  }>({
    query: query,
  });

  if (!data || error) {
    console.error("Error fetching footer information:", error);
    throw new Error("Failed to fetch footer information");
  }

  if (!data.findFooterSingleton?.data) {
    return {} as Footer;
  }

  return flattenData(data, locale).findFooterSingleton as Footer;
}
