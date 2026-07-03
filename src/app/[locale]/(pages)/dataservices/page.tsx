import { fetchDataservices } from "@/service/api/dataservices";
import DataservicesClient from "@/components/dataservices/DataservicesClient";
import { parseDataservicesFilters } from "@/utils/dataservicesListingQuery";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "APIs - dados.gov.pt",
  description: "Explore as APIs de dados abertos disponíveis em Portugal.",
};

export default async function DataservicesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const page = Number(resolved?.page) || 1;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(resolved ?? {})) {
    if (value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) {
      params.append(key, item);
    }
  }
  const filters = parseDataservicesFilters(params);

  const initialData = await fetchDataservices(page, 20, filters);

  return <DataservicesClient initialData={initialData} currentPage={page} />;
}
