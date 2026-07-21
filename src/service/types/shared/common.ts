import { FoListPageNoResults } from "./fo-list-pages";

export interface Image {
  url: string;
  fileName: string;
  id: string;
  slug: string;
}

export interface Hero {
  title: string;
  subtitle: string;
  description: string;
  image: Image[];
  updatedAt: string;
}

export interface Anchor {
  children: string;
  href: string;
  icon: string | null;
}

export interface Sitemap {
  title: string;
  links: Anchor[];
}

export interface FileDocument {
  id: string
  url: string
  fileName: string
  slug: string
  fileSize: number
  fileType: string
  metadataText: string
}

export interface SearchBar{
  label: string;
  placeholder: string;
  searchActionAltText: string;
  voiceActionAltText: string;
}

 export interface Metadata {
  slug: string;
  theme: string;
  organizationName: string;
  title: string;
  description: string;
  image: Image[];
  createdAt: string;
  tags: {
    tag: string;
  };
};

export interface FrontOfficePage{
  id: string;
  metadata: Metadata;
  hero: Hero;
  search: SearchBar;
  noResults: FoListPageNoResults;
}