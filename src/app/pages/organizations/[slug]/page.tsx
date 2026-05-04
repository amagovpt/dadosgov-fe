import { notFound } from 'next/navigation';
import { fetchOrganization } from '@/services/api';
import OrganizationDetailClient from '@/components/organizations/OrganizationDetailClient';

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

    return <OrganizationDetailClient organization={organization} />;
}
