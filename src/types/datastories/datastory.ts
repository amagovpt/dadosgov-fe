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
  card: {
    id: string;
    icon: string;
    title: string;
    subtitle: string;
    bignumber: BigNumber;
    anchor: Anchor;
  };
};

export type DatastoryHero = {
  title: string;
  description: string;
  cards: Card[];
  dateReference: DateReference;
};

export type DatastorySection = {
  title: string;
  description: string;
  iframeSource: string;
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
