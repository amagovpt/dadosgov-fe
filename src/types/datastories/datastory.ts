type DateReference = {
  title: string;
  date: string;
};

type BigNumber = {
  number: string;
  description: string;
};

type Anchor = {
  children: string;
  href: string;
};

type Card = {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  bignumber: BigNumber;
  anchor: Anchor;
};

export type DatastoryHero = {
  title: string;
  description: string;
  cards: Card[];
  dateReference: DateReference;
};

type Iframe = {
  source: string;
  classNames: string;
}

export type DatastorySection = {
  id: string;
  title: string;
  description: string;
  iframe: Iframe[];
};

type Source = {
  children: string;
  href: string;
};

export type DatastorySource = {
  title: string;
  description: string;
  sources: Source[];
};

export type Datastory = {
  hero: DatastoryHero;
  sections: DatastorySection[];
  dataSource: DatastorySource;
};
