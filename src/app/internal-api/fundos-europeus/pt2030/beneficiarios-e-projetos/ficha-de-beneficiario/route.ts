import { queryLoadMorePT2030ProjectsByBeneficiary } from "@/service/queries/datastories/datastory";
import { PT2030ProjectsByBeneficiaryResponse } from "@/service/types/datastories/pt2030/pt2030";
import apolloClient from "@/service/utils/apollo-client";

export async function POST(request: Request) {
  try {
    const { nif, entityRole, page } = await request.json();
    const { data, error } = await apolloClient.query<{
      queryProjectsByBeneficiarySheetOfPortugal2030: PT2030ProjectsByBeneficiaryResponse;
    }>({
      query: queryLoadMorePT2030ProjectsByBeneficiary,
      variables: { nif, entityRole, page },
    });

    if (error || !data) {
      console.error("GraphQL error:", error);
      return new Response(JSON.stringify({ error }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data.queryProjectsByBeneficiarySheetOfPortugal2030), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
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
