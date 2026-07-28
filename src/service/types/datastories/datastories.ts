import {
  Image,
  FoListPageHero,
  FoListPageNoResults,
  FoListPageSearch,
} from "@/service/types/shared";

// ----------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------

export type DataStoryMetadata = {
  slug: string;
  theme: string;
  organizationName: string;
  title: string;
  description: string;
  image: Image[];
  createdAt: string;
  tags: {
    tag: string;
  };
};

export type Datastories = DataStoryMetadata[];

// ----------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------

export type DataStoriesPage = {
  hero: FoListPageHero;
  search: FoListPageSearch;
  noResults: FoListPageNoResults;
};
