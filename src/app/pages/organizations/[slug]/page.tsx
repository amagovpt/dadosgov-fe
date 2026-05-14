import { notFound } from 'next/navigation';
import { fetchOrganization } from '@/services/api';
import OrganizationDetailClient from '@/components/organizations/OrganizationDetailClient';
import { sanitizeUserMarkdown } from '@/utils/sanitizeUserMarkdown';

export const dynamic = 'force-dynamic';

export default async function Page({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const organization = await fetchOrganization(slug);

    if (!organization) {
        notFound();
    }

    const safeOrganization = {
        ...organization,
        description: sanitizeUserMarkdown(organization.description),
    };

    return <OrganizationDetailClient organization={safeOrganization} />;
}
