import { BreadcrumbItem } from "../shared";

type Anchor = {
  children: string;
  href: string;
  icon: string;
};

type DateReference = {
  title: string;
  date: string;
};

type Card = {
  icon: string;
  title: string;
  subtitle: string;
  description: string;
};

// ----------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------

// Built from the sections by buildDatastoryIndex; sections carry no icon of their own.
export type IndexAnchor = {
  children: string;
  href: string;
  icon?: string;
};

type Index = {
  title: string;
  anchors: IndexAnchor[];
};

export type DatastoryHero = {
  title: string;
  description: string;
  index: Index;
  breadcrumbs: BreadcrumbItem[];
};

// ----------------------------------------------------------------------------------------------

type Bignumbers = {
  icon: string;
  number: string;
  numberLabel: string;
  subtitle: string;
  title: string;
};

export type BigNumbersSection = {
  schemaName: "section-datastory-bignumbers";
  id: string;
  active?: boolean;
  title: string;
  bignumbers: Bignumbers[];
  dataReference: DateReference;
};

// ----------------------------------------------------------------------------------------------

export type BigNumbersIframeSection = {
  schemaName: "section-datastory-bignumbers-iframe";
  id: string;
  active?: boolean;
  title: string;
  iframe: Iframe[];
};

// ----------------------------------------------------------------------------------------------

type TimelineEvent = {
  label: string;
  icon: string;
  title: string;
  description: string;
};

type Timeline = {
  title: string;
  description: string;
  events: TimelineEvent[];
};

export type TimelineSection = {
  schemaName: "section-datastory-timeline";
  id: string;
  active?: boolean;
  title: string;
  description: string;
  cards: Card[];
  cardsLinkIcon: string;
  anchor: Anchor;
  timeline: Timeline;
};

// ----------------------------------------------------------------------------------------------

type PublicAdminStructure = {
  centralAdmin: Card;
  regionalAdmin: Card;
  localAdmin: Card;
  socialFunds: Card;
  publicAdmin: Card;
};

export type PublicAdminStructureSection = {
  schemaName: "section-datastory-public-admin-structure";
  id: string;
  active?: boolean;
  title: string;
  parts: PublicAdminStructure;
};

// ----------------------------------------------------------------------------------------------

type Iframe = {
  source: string;
  classNames: string;
  classNameIframeBackground: string;
};

export type IframeSection = {
  schemaName: "section-datastory-iframe";
  id: string;
  active?: boolean;
  title?: string;
  description?: string;
  links?: Anchor[];
  iframe: Iframe[];
};

// ----------------------------------------------------------------------------------------------

type RelatedDatastory = {
  createdAt: string;
  title: string;
  description: string;
  slug: string;
};

export type RelatedSection = {
  schemaName: "section-datastory-related-datastory";
  id: string;
  active?: boolean;
  title: string;
  description: string;
  datastories: RelatedDatastory[];
};

// ----------------------------------------------------------------------------------------------

type Metadata = {
  image?: string[];
  slug: string;
  organizationName: string;
  title: string;
  description: string;
  createdAt: string;
};

export type SourceSection = {
  schemaName: "section-datastory-datasets";
  id: string;
  active?: boolean;
  title: string;
  datasets: Metadata[];
};

// ----------------------------------------------------------------------------------------------

type Resource = {
  icon: string;
  title: string;
  subtitle: string;
  anchor: Anchor;
};

export type OtherSection = {
  schemaName: "section-datastory-other-resources";
  id: string;
  active?: boolean;
  title: string;
  resources: Resource[];
};

// ----------------------------------------------------------------------------------------------

export type SummarySection = {
  schemaName: "section-datastory-summary";
  id: string;
  active?: boolean;
  title: string;
  description: string;
  anchors: Anchor[];
};

// ----------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------

export type DatastorySection =
  | BigNumbersSection
  | BigNumbersIframeSection
  | TimelineSection
  | PublicAdminStructureSection
  | IframeSection
  | RelatedSection
  | SourceSection
  | OtherSection
  | SummarySection;

export type DatastorySections = {
  isFirstSectionWhite: boolean;
  sections: DatastorySection[];
};

// ----------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------

export type Datastory = {
  hero: DatastoryHero;
  sections: DatastorySections;
};

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

export type QueryProjectsFiltersPt2030 = {
  funds: string[];
  policyObjectives: string[];
  programmes: string[];
  thematicAreas: string[];
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
