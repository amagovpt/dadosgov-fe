import { fetchOrganizationsListing } from "@/service/api/organizations";
import OrganizationsClient from '@/components/organizations/OrganizationsClient';
import { OrganizationFilters } from "@/service/types/identity";
import { serverForwardedHeaders } from "@/service/utils/serverForwardedHeaders";
import { Metadata } from 'next';

// The page is already dynamic (it reads searchParams); we intentionally do NOT
// force-dynamic so the listing fetch can use the Next.js Data Cache
// (revalidate: 60) — repeated page/query loads are served from cache and don't
// hit the backend rate-limit (per-IP, collapsed site-wide by the F5).

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
    // Relay the real client IP on the SSR fetch (which, on a Data Cache miss,
    // goes direct to the backend) so the limiter keys per visitor, not the Next IP.
    const forwarded = await serverForwardedHeaders();
    const data = await fetchOrganizationsListing(page, 20, apiFilters, forwarded);

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
