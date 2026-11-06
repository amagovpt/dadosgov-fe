import { queryLoadMoreBeneficiariesInProjectSheetOfPortugal2020 } from "@/service/queries/datastories/datastories-pt2020";
import { PT2020ProjectSheetBeneficiaryResponse } from "@/service/types/datastories/pt2020/pt2020";
import apolloClient from "@/service/utils/apollo-client";

export async function POST(request: Request) {
  try {
    const { projectCode, beneficiaryType, limit, page } = await request.json();
    const { data, error } = await apolloClient.query<{
      queryLoadMoreBeneficiariesInProjectSheetOfPortugal2020: PT2020ProjectSheetBeneficiaryResponse;
    }>({
      query: queryLoadMoreBeneficiariesInProjectSheetOfPortugal2020,
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
      JSON.stringify(data.queryLoadMoreBeneficiariesInProjectSheetOfPortugal2020),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
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
      }
    );
  }
}
