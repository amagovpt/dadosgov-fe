import { notFound } from 'next/navigation';
import { fetchOrganization } from "@/service/api/organizations";
import OrganizationDetailClient from '@/components/organizations/OrganizationDetailClient';
import { sanitizeUserMarkdown } from '@/utils/sanitizeUserMarkdown';
import { serverForwardedHeaders } from "@/service/utils/serverForwardedHeaders";

export const dynamic = 'force-dynamic';

export default async function Page({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    // Relay the real client IP on this SSR fetch (which goes direct to the
    // backend, bypassing the F5) so the rate limiter keys per visitor instead
    // of collapsing everyone into the Next.js server IP bucket.
    const forwarded = await serverForwardedHeaders();
    const organization = await fetchOrganization(slug, forwarded);

    if (!organization) {
        notFound();
    }

    const safeOrganization = {
        ...organization,
        description: sanitizeUserMarkdown(organization.description),
    };

    return <OrganizationDetailClient organization={safeOrganization} />;
}
