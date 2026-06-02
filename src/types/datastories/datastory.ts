type Anchor = {
  children: string;
  href: string;
  icon: string;
};

type BigNumber = {
  number: string;
  description: string;
};

export type Card = {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  bignumber: BigNumber;
  anchor: Anchor;
};

type DateReference = {
  title: string;
  date: string;
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

type RelatedSection = {
  schemaName: "section-datastory-related";
  title: string;
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

export type OtherSection = {
  schemaName: "section-datastory-other-resources";
  title: string;
  resources: Card[];
};

// ----------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------

export type DatastorySection =
  | BigNumbersSection
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
