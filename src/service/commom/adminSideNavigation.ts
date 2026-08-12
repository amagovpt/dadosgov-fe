import apolloClient from "@/service/utils/apollo-client";
import { AdminSideNavigationData } from "@/service/types/admin-side-navigation";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";

export async function getAdminSideNavigation(
  locale: string = "pt"
): Promise<AdminSideNavigationData> {
  const query = gql(/* GraphQL */ `
        query GetAdminSideNavigation {
         findAdminSideNavigationSingleton {
            data {
                homeLink {
                    ${locale}{
                    id
                    label
                    href
                    icon
                    enabled
                    }
                }
                groups {
                    ${locale}{
                    id
                    key
                    label
                    icon
                    enabled
                    children {
                        id
                        label
                        href
                        icon
                        logo
                        enabled
                    }
                    }
                }
                orgChildren {
                    ${locale}{
                    id
                    label
                    href
                    icon
                    enabled
                    }
                }
            }
        }
    }
  `);

  const { data, error } = await apolloClient.query<{
    findAdminSideNavigationSingleton: { data: Record<string, unknown> };
  }>({
    query: query,
  });

  if (!data || error) {
    console.error("Error fetching admin side navigation:", error);
    throw new Error("Failed to fetch admin side navigation");
  }

  if (!data.findAdminSideNavigationSingleton?.data) {
    return {} as AdminSideNavigationData;
  }

  return flattenData(data, locale).findAdminSideNavigationSingleton as AdminSideNavigationData;
}
