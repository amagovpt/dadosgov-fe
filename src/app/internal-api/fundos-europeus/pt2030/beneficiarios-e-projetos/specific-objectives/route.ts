import { NextRequest, NextResponse } from "next/server";
import apolloClient from "@/service/utils/apollo-client";
import { getSpecificObjectivesByPolicyObjective } from "@/service/queries/datastories/datastory";

interface SpecificObjective {
  code: string;
  shortName: string;
}

export async function GET(request: NextRequest) {
  try {
    const policyObjective = request.nextUrl.searchParams.get("policyObjective");

    if (!policyObjective) {
      return NextResponse.json(
        { error: "policyObjective parameter is required" },
        { status: 400 }
      );
    }

    const { data, error } = await apolloClient.query<{
      querySpecificObjectivesByPolicyObjectiveOfPortugal2030: {
        data: SpecificObjective[];
      };
    }>({
      query: getSpecificObjectivesByPolicyObjective(),
      variables: { policyObjective },
      fetchPolicy: "network-only",
    });

    if (error) {
      console.error("[API Route specificObjectives] GraphQL error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: data?.querySpecificObjectivesByPolicyObjectiveOfPortugal2030?.data || [],
    });
  } catch (error) {
    console.error("[API Route specificObjectives] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
