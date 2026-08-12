import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";
import { NewsPage } from "@/service/types/news";

export async function getNewsPage(locale: string = "pt"): Promise<NewsPage> {
  const query = gql(/* GraphQL */ `
       query getNewsPage {
        findNewsSingleton {
            data {
                hero {
                    ${locale} {
                        title
                        description
                        subtitle
                    }
                }
                searchBar {
                    ${locale} {
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
    findNewsSingleton: { data: Record<string, unknown> };
  }>({
    query: query,
  });

  if (!data || error) {
    console.error("Error fetching News information:", error);
    throw new Error("Failed to fetch News information");
  }

  if (!data.findNewsSingleton?.data) {
    return {} as NewsPage;
  }

  return flattenData(data, locale).findNewsSingleton as NewsPage;
}
