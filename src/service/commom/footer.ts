import apolloClient from "@/service/utils/apollo-client";
import { HeaderNavigationData } from "@/service/types/header";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";
import { Footer } from "../types/header/footer";

export async function getFooter(locale: string = "pt"): Promise<Footer> {
  const query = gql(/* GraphQL */ `
    query MyQuery {
        findFooterSingleton {
            data {
                title {
                    pt
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
                    pt
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
                    pt
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

  const headerData = data.findFooterSingleton?.data;

  if (!headerData) {
    return {} as Footer;
  }

  return flattenData(headerData) as unknown as Footer;
}
