import { queryLoadMorePrrProjectsByBeneficiary } from "@/service/queries/datastories/datastory";
import {
  PRRBeneficiaryRelatedProjectsResponse,
  PRRBeneficiaryRelatedProjectsType,
} from "@/service/types/datastories/prr/prr";
import apolloClient from "@/service/utils/apollo-client";

type RequestBody = {
  nif?: string;
  type?: string;
  page?: number;
  limit?: number;
};

const ALLOWED_TYPES: readonly PRRBeneficiaryRelatedProjectsType[] = [
  "BENEFICIARY",
  "INTERMEDIARY",
  "PARTNER",
  "SUPPLIER",
];

const MAX_LIMIT = 50;

function isAllowedType(type: unknown): type is PRRBeneficiaryRelatedProjectsType {
  return ALLOWED_TYPES.includes(type as PRRBeneficiaryRelatedProjectsType);
}

function toPositiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: Request) {
  try {
    const { nif, type, page, limit } = (await request.json()) as RequestBody;

    if (!nif || typeof nif !== "string" || !isAllowedType(type)) {
      return jsonResponse({ error: "Invalid nif or type" }, 400);
    }

    const { data, error } = await apolloClient.query<{
      queryBeneficiaryRelatedProjectsOfPRR: PRRBeneficiaryRelatedProjectsResponse;
    }>({
      query: queryLoadMorePrrProjectsByBeneficiary(type),
      variables: {
        nif,
        page: toPositiveInt(page, 1),
        limit: Math.min(toPositiveInt(limit, 5), MAX_LIMIT),
      },
      fetchPolicy: "no-cache",
    });

    if (error || !data) {
      console.error("GraphQL error:", error);
      return jsonResponse({ error }, 400);
    }

    return jsonResponse(data.queryBeneficiaryRelatedProjectsOfPRR, 200);
  } catch (error) {
    console.error("Error fetching data:", error);
    return jsonResponse(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
}
