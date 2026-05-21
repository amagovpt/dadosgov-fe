import { fetchOrganizations } from "@/app/api/organizations";
import { fetchReuses } from "@/app/api/reuses";
import ReusesClient from '@/components/reuses/ReusesClient';
import { ReuseFilters } from '@/service/types/api';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

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

    const now = new Date();
    const d30 = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);
    const d12m = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().slice(0, 10);
    const d3y = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate()).toISOString().slice(0, 10);

    const [initialData, totalRes, d30Res, d12mRes, d3yRes, allOrganizations] = await Promise.all([
        fetchReuses(page, 12, apiFilters),
        fetchReuses(1, 1),
        fetchReuses(1, 1, { modified_since: d30 }),
        fetchReuses(1, 1, { modified_since: d12m }),
        fetchReuses(1, 1, { modified_since: d3y }),
        fetchOrganizations(1, 100, { sort: "-datasets" }),
    ]);

    const filterCounts: Record<string, number> = {
        atualizacao_all: totalRes.total,
        atualizacao_30_days: d30Res.total,
        atualizacao_12_months: d12mRes.total,
        atualizacao_3_years: d3yRes.total,
    };

    return (
        <ReusesClient
            initialData={initialData}
            currentPage={page}
            filterCounts={filterCounts}
            allOrganizations={allOrganizations.data}
        />
    );
}
