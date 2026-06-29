import { Publication } from "@/service/types/resources/publications";

export const PUBLICATIONS_PAGE_SIZE = 4;

export type PublicationsSort = "recente" | "antigo";

export const PUBLICATIONS_SORT_LABELS: Record<PublicationsSort, string> = {
  recente: "Mais recente",
  antigo: "Mais antigo",
};

export function parsePublicationsSort(value?: string): PublicationsSort {
  return value === "antigo" ? "antigo" : "recente";
}

export function sortPublications(
  pubs: Publication[],
  sort: PublicationsSort
): Publication[] {
  return [...pubs].sort((a, b) => {
    const aTime = new Date(a.metaDetails.updatedAt).getTime();
    const bTime = new Date(b.metaDetails.updatedAt).getTime();
    return sort === "antigo" ? aTime - bTime : bTime - aTime;
  });
}
