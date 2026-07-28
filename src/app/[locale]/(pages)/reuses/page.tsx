import { fetchReusesListing } from "@/service/api/reuses";
import ReusesClient from '@/components/reuses/ReusesClient';
import { ReuseFilters } from "@/service/types/reuse";
import { serverForwardedHeaders } from "@/service/utils/serverForwardedHeaders";
import { Metadata } from 'next';
import { getFrontOfficeMetadata, getFrontOfficePage } from "@/service/queries/common";
import { stripHtmlTags } from "@/utils/htmlToParagraphs";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const metadata = await getFrontOfficeMetadata("reuses",locale);

  return {
    title: metadata.title,
    description: stripHtmlTags(metadata.description),
  };
}


export default async function ReusesPage({
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{
        page?: string;
        q?: string;
        type?: string;
        tag?: string | string[];
        organization?: string | string[];
        sort?: string;
        modified_since?: string;
    }>;
}) {
    const resolvedSearchParams = await searchParams;
    const page = Number(resolvedSearchParams?.page) || 1;
    const filters: ReuseFilters = {
        ...(resolvedSearchParams?.q && { q: resolvedSearchParams.q }),
        ...(resolvedSearchParams?.type && { type: resolvedSearchParams.type }),
        ...(resolvedSearchParams?.tag && { tag: resolvedSearchParams.tag }),
        ...(resolvedSearchParams?.organization && { organization: resolvedSearchParams.organization }),
        ...(resolvedSearchParams?.sort && { sort: resolvedSearchParams.sort }),
        ...(resolvedSearchParams?.modified_since && { modified_since: resolvedSearchParams.modified_since }),
    };
    // Relevance sort: when no search query, fall back to default (most recent first)
    const apiFilters = { ...filters };
    if (!apiFilters.sort && !apiFilters.q) {
        apiFilters.sort = '-last_modified';
    }

    // LEDG-1836: one aggregated call replaces the prior Promise.all of 6 fetches.
    // Relay the real client IP on the SSR fetch (which, on a Data Cache miss,
    // goes direct to the backend) so the limiter keys per visitor, not the Next IP.
    const forwarded = await serverForwardedHeaders();
    const data = await fetchReusesListing(page, 12, apiFilters, forwarded);

    const pageContent = await getFrontOfficePage("reuses","pt");

    return (
        <ReusesClient
            initialData={data.listing}
            currentPage={page}
            filterCounts={data.filter_counts}
            allOrganizations={data.organizations}
            pageContent={pageContent}
        />
    );
}
