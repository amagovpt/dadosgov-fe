export interface ApiReferenceMetadata {
  title: string;
  description: string;
}

export interface ApiReferenceHero {
  title: string;
  description: string;
}

export interface ApiReferenceSection {
  id: string;
  title: string;
  content: string;
  enabled?: boolean | null;
}

export interface ApiReferencePage {
  metadata: ApiReferenceMetadata;
  hero: ApiReferenceHero;
  sections: ApiReferenceSection[];
  swaggerSpecUrl: string;
}
