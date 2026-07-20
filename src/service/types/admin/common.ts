export type AdminHero = {
  title: string;
  description: string;
};

export type AdminMetadata = {
  title: string;
  description: string;
};

export type AdminAnchor = {
  children: string;
  href: string;
};

export type AdminHelpBlock = {
  title: string;
  description: string;
  anchor?: AdminAnchor;
};

export type AdminBigNumber = {
  description: string;
  number: string;
  schemaId: string;
  schemaName: string;
};

export type AdminCard = {
  icon?: string;
  title: string;
  subtitle?: string;
  description: string;
  bignumber?: AdminBigNumber;
  anchor?: AdminAnchor;
};

export type AdminAuxiliaryItem = {
  enabled?: boolean;
  title: string;
  description: string;
  anchor?: AdminAnchor;
};
