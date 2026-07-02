import { BreadcrumbItem, Image } from "../shared";

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

type Index = {
  title: string;
  anchors: Anchor[];
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
  title: string;
  bignumbers: Bignumbers[];
  dataReference: DateReference;
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
  title: string;
  description: string;
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
  title: string;
  resources: Resource[];
};

// ----------------------------------------------------------------------------------------------

export type SummarySection = {
  schemaName: "section-datastory-summary";
  id: string;
  title: string;
  description: string;
  anchors: Anchor[];
};

// ----------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------

export type DatastorySection =
  | BigNumbersSection
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

// ----------------------------------------------------------------------------------------------
