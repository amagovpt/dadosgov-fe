import { fetchDataservices } from "@/service/api/dataservices";
import DataservicesClient from '@/components/dataservices/DataservicesClient';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'APIs - dados.gov.pt',
  description: 'Explore as APIs de dados abertos disponíveis em Portugal.',
};

export default async function DataservicesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const page = Number(resolved?.page) || 1;

  const filters: { q?: string; sort?: string } = {};
  if (resolved?.q) filters.q = String(resolved.q);
  if (resolved?.sort) filters.sort = String(resolved.sort);

  const initialData = await fetchDataservices(page, 20, filters);

  return (
    <DataservicesClient
      initialData={initialData}
      currentPage={page}
      initialFilters={filters}
    />
  );
}
