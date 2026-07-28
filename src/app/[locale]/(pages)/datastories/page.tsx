import DataStoriesClient from "@/components/datastories/DataStoriesClient";
import { getDataStories, getDataStoriesMetadata } from "@/service/queries/datastories/datastories";
import { stripHtmlTags } from "@/utils/htmlToParagraphs";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const metadata = await getDataStoriesMetadata(locale);

  return {
    title: metadata.title,
    description: stripHtmlTags(metadata.description),
  };
}

export default async function DataStoriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; q?: string; sort?: string }>;
}) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;

  const page = Number(resolvedSearchParams?.page) || 1;
  const filters = {
    ...(resolvedSearchParams?.q && { q: resolvedSearchParams.q }),
    ...(resolvedSearchParams?.sort && { sort: resolvedSearchParams.sort }),
  };

  const { pageContent, datastories } = await getDataStories(locale);

  return (
    <DataStoriesClient
      currentPage={page}
      initialFilters={filters}
      pageContent={pageContent}
      datastories={datastories}
    />
  );
}
