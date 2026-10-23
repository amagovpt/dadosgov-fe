import { print } from "graphql";
import { getBeneficiariesOfPRR } from "@/service/queries/datastories/datastory";
import { getCmsBaseUrl } from "@/service/utils/cmsBaseUrl";
import { FilterValue } from "@/store/searchBenProj-store";
import {
  BeneficiaryResponseItemPrr,
  PRRSearchBeneficiariesResponse,
  PRRSearchBeneficiaryItem,
  SearchBeneficiariesPrrRequestBody,
} from "@/service/types/datastories/prr/prr";

// Same transport as the PT2030 beneficiaries search: the shared apolloClient times out
// after 10s and caches every result, which does not fit the unpaginated download.
const SEARCH_TIMEOUT_MS = 60_000;

const toNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return 0;
};

const mapSortBy = (sortBy?: SearchBeneficiariesPrrRequestBody["sortBy"]) => {
  if (sortBy === "PROJECTS_AMOUNT") return "PROJECTS_AMOUNT";
  if (sortBy === "PAID_VALUE") return "PAID_BUDGET";
  return "BUDGET";
};

// The listing components are shared with PT2030, so PRR rows are renamed onto the
// PT2030 beneficiary fields, plus the amount split by the beneficiary type.
const mapToResponseItem = (item: PRRSearchBeneficiaryItem): BeneficiaryResponseItemPrr => {
  const approvedValue = toNumber(item.budget);
  const paidValue = toNumber(item.paidBudget);

  const isIntermediateBeneficiary = Boolean(item.intermediaryRecipient);
  const isBeneficiary = Boolean(item.finalRecipient);
  const isSupplier = Boolean(item.supplierRecipient);
  const isPartner = Boolean(item.partnerRecipient);

  return {
    entityName: item.recipientName ?? "",
    entityNif: item.recipientId ?? "",
    entityRole: item.recipientType ?? "",
    dimension: item.dimension ?? "",
    region: item.dsNutsii ?? "",
    municipality: item.dsMunicipalities ?? "",
    projectsAmount: toNumber(item.numProjects),
    approvedValue,
    paidValue,
    approvedValueIntermediateBeneficiaries: isIntermediateBeneficiary ? approvedValue : 0,
    approvedValueBeneficiaries: isBeneficiary ? approvedValue : 0,
    approvedValueSuppliers: isSupplier ? approvedValue : 0,
    approvedValuePartners: isPartner ? approvedValue : 0,
    paidValueIntermediateBeneficiaries: isIntermediateBeneficiary ? paidValue : 0,
    paidValueBeneficiaries: isBeneficiary ? paidValue : 0,
    paidValueSuppliers: isSupplier ? paidValue : 0,
    paidValuePartners: isPartner ? paidValue : 0,
  };
};

export async function POST(request: Request) {
  const body = (await request.json()) as SearchBeneficiariesPrrRequestBody;

  // prepare variables for the query

  const roles = new Set(body.entityRole ?? []);

  let variables: Record<string, FilterValue> = {
    limit: body.limit ?? 10,
    page: body.page ?? 1,
    sortBy: mapSortBy(body.sortBy),
    sortOrder: body.sortOrder ?? "DESC",
    recipientName: body.name ?? "",
    recipientId: body.nif ?? "",
    intermediaryRecipient: roles.has("intermediateBeneficiaries"),
    finalRecipient: roles.has("beneficiaries"),
    supplierRecipient: roles.has("suppliers"),
    partnerRecipient: roles.has("partners"),
  };

  if (body.dimensions) variables = { ...variables, dimension: body.dimensions };
  if (body.regions) variables = { ...variables, region: body.regions };
  if (body.municipalities) variables = { ...variables, municipality: body.municipalities };

  // the store names the amount after the selected indicator; PRR has the budget and the paid
  // budget, and no executed amount for beneficiaries
  const budgetMin = body.approvedValueMin ?? body.executedValueMin;
  const budgetMax = body.approvedValueMax ?? body.executedValueMax;

  if (budgetMin !== undefined) variables = { ...variables, budgetMin: Number(budgetMin) };
  if (budgetMax !== undefined) variables = { ...variables, budgetMax: Number(budgetMax) };
  if (body.paidValueMin !== undefined) {
    variables = { ...variables, paidBudgetMin: Number(body.paidValueMin) };
  }
  if (body.paidValueMax !== undefined) {
    variables = { ...variables, paidBudgetMax: Number(body.paidValueMax) };
  }
  if (body.projectsAmountMin !== undefined) {
    variables = { ...variables, projectsAmountMin: Number(body.projectsAmountMin) };
  }
  if (body.projectsAmountMax !== undefined) {
    variables = { ...variables, projectsAmountMax: Number(body.projectsAmountMax) };
  }

  // make the query request

  let data: { searchBeneficiariesOfPRR: PRRSearchBeneficiariesResponse } | undefined;
  let error: unknown;

  try {
    const res = await fetch(`${getCmsBaseUrl()}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: print(getBeneficiariesOfPRR()), variables }),
      cache: "no-store",
      signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
    });
    const json = await res.json();
    data = json.data;
    error = json.errors ?? (res.ok ? undefined : res.statusText);
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  // handle error

  if (!data?.searchBeneficiariesOfPRR || error) {
    console.error("GraphQL error:", error);
    return new Response(JSON.stringify({ error }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  // handle response

  const { searchBeneficiariesOfPRR } = data;
  const filters = searchBeneficiariesOfPRR.filters;

  return new Response(
    JSON.stringify({
      limit: searchBeneficiariesOfPRR.limit,
      page: searchBeneficiariesOfPRR.page,
      total: searchBeneficiariesOfPRR.total,
      totalFiltered: searchBeneficiariesOfPRR.totalFiltered,
      filters: {
        approvedValueMin: toNumber(filters?.budgetMin),
        approvedValueMax: toNumber(filters?.budgetMax),
        executedValueMin: toNumber(filters?.budgetMin),
        executedValueMax: toNumber(filters?.budgetMax),
        paidValueMin: toNumber(filters?.paidBudgetMin),
        paidValueMax: toNumber(filters?.paidBudgetMax),
        projectsAmountMin: toNumber(filters?.projectsAmountMin),
        projectsAmountMax: toNumber(filters?.projectsAmountMax),
      },
      data: (searchBeneficiariesOfPRR.data ?? []).map(mapToResponseItem),
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
