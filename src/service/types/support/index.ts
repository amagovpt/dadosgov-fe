export interface FaqItem {
  title: string;
  description?: string | null;
  enabled?: boolean | null;
}

export interface FaqCategory {
  id: string;
  title: string;
  enabled?: boolean | null;
  items: FaqItem[];
}

export interface SupportAnchor {
  children: string;
  href: string;
  icon?: string | null;
}

export interface SupportMetadata {
  title: string;
  description: string;
}

export interface SupportHeroContent {
  title: string;
  highlight?: string | null;
  description?: string | null;
}

export interface SupportCardContent {
  id?: string | null;
  icon?: string | null;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  anchor?: SupportAnchor | null;
}

export interface SupportPageContent {
  metadata: SupportMetadata;
  hero: SupportHeroContent;
  faqUpdatedDate: string;
  faqSections: FaqCategory[];
  helpCard: SupportCardContent;
  questionInfoCard: SupportCardContent;
  feedbackInfoCard: SupportCardContent;
  datasetRequestCards: SupportCardContent[];
}
