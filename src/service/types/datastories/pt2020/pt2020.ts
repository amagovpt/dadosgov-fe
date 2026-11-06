// ----------------------------------------------------------------------------------------------

/** SEARCH PAGES **/

import { DatastoryHero, RelatedSection, SourceSection } from "../datastory";

export type Filter = {
  name: string;
  label: string;
};

export type SortParam = {
  name: string;
  label: string;
};

export type NoResults = {
  image: { url: string }[];
  title: string;
  description: string;
};

export type QueryFiltersPt2020 = {
  funds: string[];
  programmes: string[];
  areas: string[];
  regions: string[];
  municipalities: string[];
};

export type SourceInfo = {
  format: string;
  modificationDate: string;
  publicationDate: string;
  source: string;
  referenceDate: string;
  sourceLink: string;
  title: string;
  updateDate: string;
  url: string;
};

export type DatastorySearchPage = {
  hero: DatastoryHero;
  bigNumberTitle: string;
  bigNumbers: string[];
  block: {
    title: string;
    description: string;
  };
  inputSearch: {
    label: string;
    placeholder: string;
    searchActionAltText: string;
    voiceActionAltText: string;
  };
  filters: Filter[];
  sortBy: SortParam[];
  noResults: NoResults[];
  relatedDatasets: SourceSection;
  relatedDatastories: RelatedSection;
};

// ----------------------------------------------------------------------------------------------

/** PROJECT **/

// ----------------------------------------------------------------------------------------------

/** BENEFICIARY PAGES **/

// ----------------------------------------------------------------------------------------------
