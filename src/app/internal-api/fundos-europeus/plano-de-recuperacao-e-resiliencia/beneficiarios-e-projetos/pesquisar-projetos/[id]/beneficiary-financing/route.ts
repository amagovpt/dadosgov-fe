
import { loadMorePrrProjectSheetBeneficiaryFinancing } from "@/service/queries/datastories/datastory";
import { FinancialEntity, ProjectSheetBeneficiaryFinancingResponse, ProjectSheetBeneficiaryFinancingType } from "@/service/types/datastories/prr/prr";
import apolloClient from "@/service/utils/apollo-client";

type RequestBody = {
  beneficiaryType: ProjectSheetBeneficiaryFinancingType;
  limit?: number;
  page?: number;
  projectCode?: string;
};

function toNumber(value: number | null | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return 0;
}

function mapItems(
  items: ProjectSheetBeneficiaryFinancingResponse["data"] | null | undefined,
): FinancialEntity[] {
  return (items ?? []).map((item) => ({
    nif_entidade: item.id ?? "",
    nome: item.name ?? "",
    valor_financiamento: toNumber(item.description),
    valor_pago: toNumber(item.paid),
  }));
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { beneficiaryType, limit, page, projectCode } =
    (await request.json()) as RequestBody;
  const resolvedProjectCode = projectCode ?? decodeURIComponent(id);

  const { data, error } = await apolloClient.query<{
    queryProjectSheetBeneficiaryFinancingOfPRR: ProjectSheetBeneficiaryFinancingResponse;
  }>({
    query: loadMorePrrProjectSheetBeneficiaryFinancing(beneficiaryType),
    variables: {
      limit: limit ?? 4,
      page: page ?? 1,
      projectCode: resolvedProjectCode,
    },
  });

  if (!data || error) {
    console.error("GraphQL error:", error);
    return new Response(JSON.stringify({ error }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      data: mapItems(data.queryProjectSheetBeneficiaryFinancingOfPRR.data),
      total: data.queryProjectSheetBeneficiaryFinancingOfPRR.total,
      totalFiltered: data.queryProjectSheetBeneficiaryFinancingOfPRR.totalFiltered,
      page: data.queryProjectSheetBeneficiaryFinancingOfPRR.page,
      limit: data.queryProjectSheetBeneficiaryFinancingOfPRR.limit,
      beneficiaryType: data.queryProjectSheetBeneficiaryFinancingOfPRR.beneficiaryType,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}
