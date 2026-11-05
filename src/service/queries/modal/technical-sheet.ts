import { TechnicalSheetModalData } from "@/service/types/modal/technical-sheet";
import apolloClient from "@/service/utils/apollo-client";
import { flattenData } from "@/utils/flattenObject";
import { gql } from "@apollo/client";

export async function getTechnicalSheetData(
  slug: string,
  locale: string
): Promise<TechnicalSheetModalData> {
  const query = gql`query QueryTechnicalSheetModal($query: String!) {
    queryTechinalSheetModalContents(filter: $query) {
        data {
            header {
                ${locale} {
                    icon
                    title
                    subtitle
                }
            }
            dataInfo {
                ${locale} {
                    title
                    description
                }
            }
            body {
                ${locale} {
                    title
                    description
                }
            }
        }
    }
  }`;

  const { data, error } = await apolloClient.query<{
    queryTechinalSheetModalContents: Array<{
      data: Record<string, unknown>;
    }>;
  }>({
    query: query,
    variables: {
      query: `data/id/iv eq '${slug}'`,
    },
  });

  if (!data || error) {
    console.error("Error fetching technical sheet data:", error);
    throw new Error("Failed to fetch technical sheet data");
  }

  return flattenData(data.queryTechinalSheetModalContents[0].data) as TechnicalSheetModalData;
}
