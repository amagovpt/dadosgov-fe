export type FooterCard = {
  title: string;
  href: string;
  enabled: boolean;
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
  description: string;
  groups: FooterGroup[];
  logos: FooterLogo[];
  social: FooterSocial[];
  related: FooterRelatedLink[];
  copyright: string;
};
