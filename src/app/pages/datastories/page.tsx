import DataStoriesClient from "@/components/datastories/DataStoriesClient";
import { getDataStories } from "@/queries/datastories/datastories";
import apolloClient from "@/services/apollo-client";
import { Datastories } from "@/types/datastories/datastories";
import { flattenData } from "@/utils/flattenObject";
import { Metadata } from "next";


export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Data Stories - dados.gov.pt",
  description:
    "Explore narrativas baseadas em dados abertos para descobrir novos insights sobre Portugal.",
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
