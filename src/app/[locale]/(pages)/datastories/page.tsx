import DataStoriesClient from "@/components/datastories/DataStoriesClient";
import { getDataStories } from "@/service/queries/datastories/datastories";
import apolloClient from "@/service/utils/apollo-client";
import { Datastories } from "@/service/types/datastories/datastories";
import { flattenData } from "@/utils/flattenObject";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Data Stories - dados.gov.pt",
  description:
    "Explore as nossas data stories, narrativas visuais e interativas sobre a realidade nacional, criadas a partir de dados abertos disponíveis neste portal.",
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

  const { data, error } = await apolloClient.query<{
    queryDataStoriesContents: Datastories;
  }>({
    query: getDataStories("pt"),
  });

  if (error || !data) {
    console.error("Error:", error);
    throw new Error(error?.message ?? "Failed to fetch data");
  }

  const datastories = Object.values(
    flattenData(data.queryDataStoriesContents as unknown as Record<string, unknown>)
  ) as Datastories;

  return (
    <DataStoriesClient currentPage={page} initialFilters={filters} datastories={datastories} />
  );
}
