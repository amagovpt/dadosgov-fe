import { Image } from "@/service/types/shared";

export type Datastory = {
  slug: string;
  title: string;
  image: Image[];
  createdAt: string;
};

export type HomeHero = {
  title: string;
  highlight: string;
  description: string;
};

export type HomeDatastories = {
  description: string;
  datastories: Datastory[];
};

export type UsedDailyBy = {
  alt: string;
  anchor: {
    children: string;
    href: string;
  } | null;
  logo: Image[];
};

export type Home = {
  hero: HomeHero;
  datastories: HomeDatastories;
  usedDailyBy: UsedDailyBy[];
};
