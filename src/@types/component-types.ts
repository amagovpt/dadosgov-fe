type Link = {
  name: string;
  url: string;
};

type AnchorCardSiteMapProps = {
  children: string;
  href: string;
  appearance: string;
  variant: string;
  iconName?: string;
};

type CardCollectionLinkProps = {
  title: string;
  href: string;
  image: { url: string }[];
  description: string;
};

type Dict = {
  word: { [key: string]: string };
  description: { [key: string]: string };
};

type DictWithLetter = {
  letter: string;
  items: Dict[];
};

type HomeHero = {
  title: string;
  highlight: string;
  mostVisitedLinks: Link[];
};

type HeroGeneric = {
  title: string;
  subtitle: string;
  iconArea: string[];
  sitemap: {
    title: string;
    links: AnchorCardSiteMapProps[];
  };
};

type Card = {
  direction: string;
  image: { url: string }[];
  imageAlt: string;
  iconName: string;
  title: string;
  description: string;
  anchor: AnchorCardSiteMapProps;
};

type CardSimple = {
  id: string;
  title: string;
  href: string;
};

type Section = {
  id: string;
  iconName: string;
  title: string;
  highlight: string;
  subtitle: string;
  description: string;
  cards:
    Card[] | CardCollectionLinkProps[] | CardSimple[] | CardHighlightButton[];
  cardsgroup: {
    title: string;
    cards:
      Card[] | CardCollectionLinkProps[] | CardSimple[] | CardHighlightButton[];
  }[];
};

type CardHighlightButton = {
  title: string;
  description: string;
  image: {
    url: string;
  }[];
  button: {
    iconName: string;
    children: string;
    href: string;
  };
};

type HeaderModal = {
  iconName: string;
  title: string;
  subtitle: string;
};

type CardDownload = {
  fileName: string;
  fileType: string;
  fileUrl: string;
  lastUpdated: string;
};

type CardGoalsData = {
  dataSource: string;
  update: string;
  download: string;
  technicalSheet: string;
  cardGoals: {
    iconName: string;
    title: string;
    actualState: {
      description: string;
      value: string;
    }[];
    targetState: {
      description: string;
      value: string;
    }[];
  }[];
};

export type {
  HomeHero,
  HeroGeneric,
  Section,
  Link,
  Card,
  CardSimple,
  DictWithLetter,
  Dict,
  CardHighlightButton,
  HeaderModal,
  CardDownload,
  CardGoalsData,
};
