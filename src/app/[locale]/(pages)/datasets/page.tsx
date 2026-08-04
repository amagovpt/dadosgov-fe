import { fetchDatasetsListing } from "@/service/api/datasets";
import { DatasetFilters } from "@/service/types/dataset";
import DatasetsClient from "@/components/datasets/DatasetsClient";
import { serverForwardedHeaders } from "@/service/utils/serverForwardedHeaders";
import { Metadata } from "next";
import { getFrontOfficeMetadata, getFrontOfficePage } from "@/service/queries/common";
import { stripHtmlTags } from "@/utils/htmlToParagraphs";
import { FrontOfficePage } from "@/service/types/shared/common";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  try {
    const metadata = await getFrontOfficeMetadata("datasets", locale);

    return {
      title: metadata.title,
      description: stripHtmlTags(metadata.description),
    };
  } catch (error) {
    // Fall back to the layout's default title/description rather than failing
    // the whole page render when the CMS is unreachable.
    console.error("Error fetching datasets metadata:", error);
    return {};
  }
}

// The page is already dynamic (it reads searchParams). The listing fetch is
// cached for 60s per URL in the shared in-memory listing cache
// (service/utils/listingCache.ts) — repeated page/query loads, across all
// visitors, are served from cache and don't hit the backend rate-limit
// (per-IP, collapsed site-wide by the F5).

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;

  const resolved = await searchParams;
  const page = Number(resolved?.page) || 1;

  const filters: DatasetFilters = {};
  if (resolved?.q) filters.q = String(resolved.q);
  if (resolved?.tag) filters.tag = resolved.tag;
  if (resolved?.license) filters.license = resolved.license;
  if (resolved?.format) filters.format = resolved.format;
  if (resolved?.frequency) filters.frequency = resolved.frequency;
  if (resolved?.schema) filters.schema = String(resolved.schema);
  if (resolved?.geozone) filters.geozone = String(resolved.geozone);
  if (resolved?.granularity) filters.granularity = String(resolved.granularity);
  if (resolved?.organization) filters.organization = resolved.organization;
  if (resolved?.badge) filters.badge = resolved.badge;
  if (resolved?.sort) filters.sort = String(resolved.sort);
  if (resolved?.featured) filters.featured = resolved.featured === "true";
  if (resolved?.modified_since) filters.modified_since = String(resolved.modified_since);

  // Relevance sort: when no search query, fall back to default (most recent first)
  const apiFilters = { ...filters };
  if (!apiFilters.sort && !apiFilters.q) {
    apiFilters.sort = "-created";
  }

  // LEDG-1836: one aggregated call replaces the prior Promise.all of 14 fetches
  // (listing + 9 filter counts + organizations + licenses + frequencies + granularities).
  // Relay the real client IP on the SSR fetch (which, on a listing-cache miss,
  // goes direct to the backend) so the limiter keys per visitor, not the Next IP.
  const forwarded = await serverForwardedHeaders();
  const data = await fetchDatasetsListing(page, 20, apiFilters, forwarded);

  // Get page content (hero, search, noResults) from the CMS. The CMS is the
  // source of truth, but it must not be able to take the listing down: on error
  // we hand `undefined` to the client, which falls back to the `datasets`
  // namespace for every string.
  let pageContent: FrontOfficePage | undefined;
  try {
    pageContent = await getFrontOfficePage("datasets", locale);
  } catch (error) {
    console.error("Error fetching datasets page content:", error);
  }

  return (
    <DatasetsClient
      pageContent={pageContent}
      initialData={data.listing}
      currentPage={page}
      filterCounts={data.filter_counts}
      allOrganizations={data.organizations}
      allLicenses={data.licenses}
      allFrequencies={data.frequencies}
      allGranularities={data.granularities}
    />
  );
}
