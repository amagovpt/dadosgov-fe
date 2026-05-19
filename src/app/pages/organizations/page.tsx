import { fetchOrganizations, fetchOrgBadges } from "@/api/organizations";
import OrganizationsClient from '@/components/organizations/OrganizationsClient';
import { OrganizationFilters } from '@/types/api';
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

    const [initialData, orgBadges, allOrganizations] = await Promise.all([
        fetchOrganizations(page, 20, apiFilters),
        fetchOrgBadges(),
        fetchOrganizations(1, 100, { sort: "-datasets" }),
    ]);

    const badgeKeys = Object.keys(orgBadges);
    const badgeCountResponses = await Promise.all(
        badgeKeys.map((badge) => fetchOrganizations(1, 1, { badge }))
    );
    const orgBadgeCounts = Object.fromEntries(
        badgeKeys.map((badge, index) => [badge, badgeCountResponses[index].total])
    ) as Record<string, number>;

    return (
        <OrganizationsClient
            initialData={initialData}
            currentPage={page}
            orgBadges={orgBadges}
            orgBadgeCounts={orgBadgeCounts}
            allOrganizations={allOrganizations.data}
        />
    );
}
