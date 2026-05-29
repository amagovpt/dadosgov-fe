import apolloClient from "@/service/utils/apollo-client";
import { FaqsContent } from "@/service/types/faqs/faqs";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";

export async function getFaqs(slug: string, locale: string = "pt") {
  const query = gql`
    query GetFaqs($query: String!) {
        queryFaqsContents(
            filter: $query
        ) {
            data {
                id {
                    iv
                }
                title {
                  ${locale}
                }
                body {
                    ${locale}
                }
                actionTitle {
                    ${locale}
                }
                actions {
                    ${locale} {
                        anchor {
                            children
                            href
                        }
                    }
                }
            }
        }
    }
    `;
  const { data, error } = await apolloClient.query<{
    queryFaqsContents: Array<{
      data: Record<string, unknown>;
    }>;
  }>({
    query: query,
    variables: {
      query: `data/id/iv eq '${slug}'`,
    },
  });

  if (!data || error) {
    console.error("Error fetching introduction data information:", error);
    throw new Error("Failed to fetch introduction data information");
  }

  const faqContent = data.queryFaqsContents[0]?.data;

  if (!faqContent) {
    return {} as FaqsContent;
  }

  return flattenData(faqContent) as unknown as FaqsContent;
}
