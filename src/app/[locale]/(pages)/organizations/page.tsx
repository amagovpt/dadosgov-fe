import { fetchOrganizationsListing } from "@/service/api/organizations";
import OrganizationsClient from '@/components/organizations/OrganizationsClient';
import { OrganizationFilters } from "@/service/types/identity";
import { serverForwardedHeaders } from "@/service/utils/serverForwardedHeaders";
import { Metadata } from 'next';
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
        const metadata = await getFrontOfficeMetadata("organizations", locale);

        return {
            title: metadata.title,
            description: stripHtmlTags(metadata.description),
        };
    } catch (error) {
        // Fall back to the layout's default title/description rather than failing
        // the whole page render when the CMS is unreachable.
        console.error("Error fetching organizations metadata:", error);
        return {};
    }
}

// The page is already dynamic (it reads searchParams). The listing fetch is
// cached for 60s per URL in the shared in-memory listing cache
// (service/utils/listingCache.ts) — repeated page/query loads, across all
// visitors, are served from cache and don't hit the backend rate-limit
// (per-IP, collapsed site-wide by the F5).

export default async function OrganizationsPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { locale } = await params;

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
    // Relay the real client IP on the SSR fetch (which, on a listing-cache miss,
    // goes direct to the backend) so the limiter keys per visitor, not the Next IP.
    const forwarded = await serverForwardedHeaders();
    const data = await fetchOrganizationsListing(page, 20, apiFilters, forwarded);

    // Get page content (hero, search, noResults) from the CMS. The CMS is the
    // source of truth, but it must not be able to take the listing down: on error
    // (including a missing `organizations` CMS entry, where getFrontOfficePage
    // calls notFound()) we hand `undefined` to the client, which falls back to the
    // `organizations` namespace for every string.
    let pageContent: FrontOfficePage | undefined;
    try {
        pageContent = await getFrontOfficePage("organizations", locale);
    } catch (error) {
        console.error("Error fetching organizations page content:", error);
    }

    return (
        <OrganizationsClient
            pageContent={pageContent}
            initialData={data.listing}
            currentPage={page}
            orgBadges={data.badges}
            orgBadgeCounts={data.badge_counts}
            allOrganizations={data.organizations}
        />
    );
}
