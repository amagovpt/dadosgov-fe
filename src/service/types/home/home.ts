import { Anchor, Image } from "@/service/types/shared";
import { StatusCardType } from "@ama-pt/agora-design-system";

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

export type StatusCard = {
  isActive?: boolean;
  variant?: StatusCardType;
  showIcon?: boolean;
  pillText?: string;
  title?: string;
  description?: string;
  anchor?: Anchor;
  anchorOnRightSide?: boolean;
  dateLimit?: string;
};

export type Home = {
  hero: HomeHero;
  statusCard: StatusCard;
  datastories: HomeDatastories;
  usedDailyBy: UsedDailyBy[];
};
