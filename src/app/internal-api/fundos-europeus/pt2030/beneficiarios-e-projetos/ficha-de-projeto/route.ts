import { queryLoadMoreBeneficiariesInProjectSheetOfPortugal2030 } from "@/service/queries/areas/fundos-europeus/portugal-2030/projeto";
import { PT2030ProjectSheetBeneficiaryResponse } from "@/service/types/areas/fundos-europeus/pt2030/projeto";
import apolloClient from "@/service/utils/apollo-client";

export async function POST(request: Request) {
  try {
    const { projectCode, beneficiaryType, limit,  page } = await request.json();
    const { data, error } = await apolloClient.query<{
      queryLoadMoreBeneficiariesInProjectSheetOfPortugal2030: PT2030ProjectSheetBeneficiaryResponse;
    }>({
      query: queryLoadMoreBeneficiariesInProjectSheetOfPortugal2030,
      variables: { projectCode, beneficiaryType, limit, page },
    });

    if (error || !data) {
      console.error("GraphQL error:", error);
      return new Response(JSON.stringify({ error }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify(data.queryLoadMoreBeneficiariesInProjectSheetOfPortugal2030),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error fetching data:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
