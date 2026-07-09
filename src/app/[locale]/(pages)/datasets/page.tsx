import { fetchDatasetsListing } from "@/service/api/datasets";
import { DatasetFilters } from "@/service/types/dataset";
import DatasetsClient from "@/components/datasets/DatasetsClient";
import { serverForwardedHeaders } from "@/service/utils/serverForwardedHeaders";
import { stripHtmlTags } from "@/utils/htmlToParagraphs";
import { Metadata } from "next";
import { getDatasets, getDatasetsMetadata } from "@/service/queries/datasets/datasets";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const metadata = await getDatasetsMetadata(locale);

  return {
    title: metadata.title,
    description: stripHtmlTags(metadata.description),
  };
}

// The page is already dynamic (it reads searchParams); we intentionally do NOT
// force-dynamic so the listing fetch can use the Next.js Data Cache
// (revalidate: 60) — repeated page/query loads are served from cache and don't
// hit the backend rate-limit (per-IP, collapsed site-wide by the F5).

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
  // Relay the real client IP on the SSR fetch (which, on a Data Cache miss,
  // goes direct to the backend) so the limiter keys per visitor, not the Next IP.
  const forwarded = await serverForwardedHeaders();
  const data = await fetchDatasetsListing(page, 20, apiFilters, forwarded);

  // get page content (hero, search, noResults) from the CMS
  const { pageContent } = await getDatasets(locale);

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
