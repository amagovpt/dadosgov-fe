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
  title: string;
  description: string;
  datastories: RelatedDatastory[];
};

// ----------------------------------------------------------------------------------------------

type Source = {
  children: string;
  href: string;
};

export type SourceSection = {
  schemaName: "datasource";
  id: string;
  title: string;
  description: string;
  sources: Source[];
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
  title: string;
  resources: Resource[];
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
  | OtherSection;

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
