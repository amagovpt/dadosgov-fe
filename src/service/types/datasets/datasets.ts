import { FoListPageHero, FoListPageNoResults, FoListPageSearch } from "@/service/types/shared";

export type DatasetsPage = {
  hero: FoListPageHero;
  search: FoListPageSearch;
  noResults: FoListPageNoResults;
};
