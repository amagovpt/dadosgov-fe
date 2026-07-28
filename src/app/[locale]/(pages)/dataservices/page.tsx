import { fetchDataservices } from "@/service/api/dataservices";
import DataservicesClient from "@/components/dataservices/DataservicesClient";
import { parseDataservicesFilters } from "@/utils/dataservicesListingQuery";
import { Metadata } from "next";
import { getFrontOfficeMetadata, getFrontOfficePage } from "@/service/queries/common";
import { stripHtmlTags } from "@/utils/htmlToParagraphs";
import { FrontOfficePage } from "@/service/types/shared/common";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  try {
    const metadata = await getFrontOfficeMetadata("dataservices", locale);

    return {
      title: metadata.title,
      description: stripHtmlTags(metadata.description),
    };
  } catch (error) {
    // Fall back to the layout's default title/description rather than failing
    // the whole page render when the CMS is unreachable.
    console.error("Error fetching dataservices metadata:", error);
    return {};
  }
}

export default async function DataservicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;

  const resolved = await searchParams;
  const page = Number(resolved?.page) || 1;

  const params_ = new URLSearchParams();
  for (const [key, value] of Object.entries(resolved ?? {})) {
    if (value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) {
      params_.append(key, item);
    }
  }
  const filters = parseDataservicesFilters(params_);

  const initialData = await fetchDataservices(page, 20, filters);

  // Get page content (hero, search, noResults) from the CMS. The CMS is the
  // source of truth, but it must not be able to take the listing down: on error
  // we hand `undefined` to the client, which falls back to the `dataservices`
  // namespace for every string.
  let pageContent: FrontOfficePage | undefined;
  try {
    pageContent = await getFrontOfficePage("dataservices", locale);
  } catch (error) {
    console.error("Error fetching dataservices page content:", error);
  }

  return (
    <DataservicesClient
      pageContent={pageContent}
      initialData={initialData}
      currentPage={page}
    />
  );
}
