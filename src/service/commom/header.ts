import apolloClient from "@/service/utils/apollo-client";
import { HeaderNavigationData } from "@/service/types/header";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";

export async function getHeaderNavigation(locale: string = "pt"): Promise<HeaderNavigationData> {
  const query = gql(/* GraphQL */ `
        query GetHeaderNavigation {
         findHeaderNavigationSingleton {
            data {
                authMenuItems {
                    ${locale}{
                    bgColor
                    enabled
                    external
                    href
                    icon
                    id
                    isLogout
                    label
                    logo
                    }
                }
                topLevelLinks {
                    ${locale}{
                    bgColor
                    enabled
                    external
                    href
                    icon
                    id
                    isLogout
                    label
                    logo
                    }
                }
                dropdowns {
                    ${locale}{
                        root {
                            cards {
                                description
                                enabled
                                href
                                iconDefault
                                iconHover
                                id
                                opensSubmenu
                                title
                            }
                            id
                            label
                            requiresAuth
                            enabled
                        }
                        submenus {
                            id
                            enabled
                            label
                            requiresAuth
                            cards {
                                title
                                id
                                iconHover
                                iconDefault
                                href
                                enabled
                                description
                                opensSubmenu
                            }
                        }
                    }
                }
                ecosytems {
                    ${locale}{
                        ecosystemEntries {
                            bgColor
                            enabled
                            external
                            href
                            icon
                            id
                            isLogout
                            label
                            logo
                        }
                        artePortals {
                            logo
                            label
                            isLogout
                            icon
                            id
                            href
                            external
                            enabled
                            bgColor
                        }
                        description
                    }
                }
            }
        }
    }
  `);

  const { data, error } = await apolloClient.query<{
    findHeaderNavigationSingleton: { data: Record<string, unknown> };
  }>({
    query: query,
  });

  if (!data || error) {
    console.error("Error fetching header information:", error);
    throw new Error("Failed to fetch header information");
  }

  const headerData = data.findHeaderNavigationSingleton?.data;

  if (!headerData) {
    return {} as HeaderNavigationData;
  }

  return flattenData(headerData) as unknown as HeaderNavigationData;
}
