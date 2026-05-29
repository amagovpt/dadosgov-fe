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

type OverviewType = "bigNumbers" | "cards" | "infographic";

export type DatastoryOverview = {
  type: OverviewType;
  data: any;
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
  overview?: any;
  sections: DatastoryIframe[];
  related?: any;
  dataSource: DatastorySource;
  other?: any;
};
