import { fetchOrganizationsListing } from "@/app/api/organizations";
import OrganizationsClient from '@/components/organizations/OrganizationsClient';
import type { OrganizationFilters } from '@/service/types/identity';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Organizações - dados.gov.pt',
    description: 'Explore as organizações que publicam dados abertos em Portugal.',
};

export default async function OrganizationsPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const resolved = await searchParams;
    const page = Number(resolved?.page) || 1;

    const filters: OrganizationFilters = {};
    if (resolved?.q) filters.q = String(resolved.q);
    if (resolved?.badge) filters.badge = resolved.badge;
    if (resolved?.organization) filters.organization = resolved.organization;
    if (resolved?.sort) filters.sort = String(resolved.sort);

    // Relevance sort: when no search query, fall back to default (most recent first)
    const apiFilters = { ...filters };
    if (!apiFilters.sort && !apiFilters.q) {
        apiFilters.sort = '-last_modified';
    }

    // LEDG-1836: one aggregated call replaces the prior Promise.all of 3 + N (badge) fetches.
    const data = await fetchOrganizationsListing(page, 20, apiFilters);

    return (
        <OrganizationsClient
            initialData={data.listing}
            currentPage={page}
            orgBadges={data.badges}
            orgBadgeCounts={data.badge_counts}
            allOrganizations={data.organizations}
        />
    );
}
