import { Image } from "@/service/types/shared";

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

export type DataStoriesHero = {
  title: string;
  description: string;
};

export type DataStoriesSearch = {
  label: string;
  placeholder: string;
  hint: string;
};

export type DataStoriesNoResults = {
  icon: string;
  title: string;
  subtitle: string;
  description: string;
};

// ----------------------------------------------------------------------------------------------

export type DataStoriesPage = {
  hero: DataStoriesHero;
  search: DataStoriesSearch;
  noResults: DataStoriesNoResults;
};
