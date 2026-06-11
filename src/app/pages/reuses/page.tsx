import { fetchReusesListing } from "@/service/api/reuses";
import ReusesClient from '@/components/reuses/ReusesClient';
import { ReuseFilters } from "@/service/types/reuse";
import { Metadata } from 'next';

// The page is already dynamic (it reads searchParams); we intentionally do NOT
// force-dynamic so the listing fetch can use the Next.js Data Cache
// (revalidate: 60) — repeated page/query loads are served from cache and don't
// hit the backend rate-limit (per-IP, collapsed site-wide by the F5).

export const metadata: Metadata = {
    title: 'Reutilizações - dados.gov.pt',
    description: 'Descubra como os dados abertos estão a ser utilizados para criar valor em Portugal. Explore as reutilizações da comunidade.',
};

export default async function ReusesPage({
    searchParams,
}: {
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
    const data = await fetchReusesListing(page, 12, apiFilters);

    return (
        <ReusesClient
            initialData={data.listing}
            currentPage={page}
            filterCounts={data.filter_counts}
            allOrganizations={data.organizations}
        />
    );
}
