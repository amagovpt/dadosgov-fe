import DataStoriesClient from '@/components/datastories/DataStoriesClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Data Stories - dados.gov.pt',
    description: 'Explore narrativas baseadas em dados abertos para descobrir novos insights sobre Portugal.',
};

export default async function DataStoriesPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; q?: string; sort?: string }>;
}) {
    const resolvedSearchParams = await searchParams;
    const page = Number(resolvedSearchParams?.page) || 1;
    const filters = {
        ...(resolvedSearchParams?.q && { q: resolvedSearchParams.q }),
        ...(resolvedSearchParams?.sort && { sort: resolvedSearchParams.sort }),
    };
    return <DataStoriesClient currentPage={page} initialFilters={filters} />;
}
