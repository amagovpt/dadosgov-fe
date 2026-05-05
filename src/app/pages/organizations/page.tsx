import { fetchOrganizations, fetchSiteInfo, fetchOrgBadges } from '@/services/api';
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

    const [initialData, siteInfo, orgBadges, allOrgsRes] = await Promise.all([
        fetchOrganizations(page, 20, apiFilters),
        fetchSiteInfo(),
        fetchOrgBadges(),
        fetchOrganizations(1, 500, { sort: 'name' }),
    ]);

    const badgeKeys = Object.keys(orgBadges);
    const badgeCounts = await Promise.all(
        badgeKeys.map((badge) => fetchOrganizations(1, 1, { badge }))
    );
    const orgBadgesWithCounts = Object.fromEntries(
        badgeKeys.map((kind, i) => [kind, badgeCounts[i].total])
    );

    return (
        <OrganizationsClient
            initialData={initialData}
            currentPage={page}
            siteMetrics={siteInfo.metrics}
            orgBadges={orgBadges}
            orgBadgeCounts={orgBadgesWithCounts}
            initialFilters={filters}
            allOrganizations={allOrgsRes.data}
        />
    );
}
