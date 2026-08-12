import { Image } from "@/service/types/shared";

export type FooterCard = {
  title: string;
  href: string;
  enabled: boolean;
};

export type FooterBrand = {
  alt: string;
  anchor: { children: string; href: string } | null;
  logo: Image[];
};

export type FooterGroup = {
  label: string;
  enabled: boolean;
  cards: FooterCard[];
};

export type FooterLogo = {
  icon: string;
  alt: string;
};

export type FooterSocial = {
  icon: string;
  href: string;
  alt: string;
};

export type FooterRelatedLink = {
  children: string;
  href: string;
};

export type Footer = {
  title: string;
  brands: FooterBrand[];
  description: string;
  groups: FooterGroup[];
  logos: FooterLogo[];
  social: FooterSocial[];
  related: FooterRelatedLink[];
  copyright: string;
};
