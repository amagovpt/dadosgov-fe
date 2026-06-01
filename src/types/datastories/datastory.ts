type DateReference = {
  title: string;
  date: string;
};

type BigNumber = {
  number: string;
  description: string;
};

type Card = {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  bignumber: BigNumber;
  anchor: Anchor;
};

// ----------------------------------------------------------------------------------------------

type Anchor = {
  children: string;
  href: string;
  icon: string;
};

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

export type Bignumbers = {
  icon: string;
  number: string;
  numberLabel: string;
  subtitle: string;
  title: string;
};

export type BigNumbersSection = {
  schemaName: "section-datastory-bignumbers";
  title: string;
  bignumbers?: Bignumbers[];
  dataReference: {
    title: string;
    date: string;
  };
};

export type DatastoryOverview = {
  section: BigNumbersSection | any | any;
};

// ----------------------------------------------------------------------------------------------

type Iframe = {
  source: string;
  classNames: string;
  classNameIframeBackground: string;
};

export type DatastoryIframe = {
  id: string;
  title: string;
  description: string;
  iframe: Iframe[];
};

// ----------------------------------------------------------------------------------------------

type Source = {
  children: string;
  href: string;
};

export type DatastorySource = {
  id: string;
  title: string;
  description: string;
  sources: Source[];
};

// ----------------------------------------------------------------------------------------------

export type Datastory = {
  hero: DatastoryHero;
  sectionOverview?: DatastoryOverview;
  sections: DatastoryIframe[];
  sectionRelated?: any;
  dataSource: DatastorySource;
  sectionOther?: any;
};
