import type { Organization, UserRef } from '@/service/types/identity';

export interface TopicElementsLink {
  rel: string;
  href: string;
  type: string;
  total: number;
}

export interface TopicSpatialCoverage {
  geom: object | null;
  zones: string[];
  granularity: string | null;
}

export interface Topic {
  id: string;
  name: string;
  slug: string;
  description: string;
  tags: string[];
  elements: TopicElementsLink;
  featured: boolean;
  private: boolean;
  created_at: string;
  last_modified: string;
  datasets_count: number;
  reuses_count: number;
  spatial: TopicSpatialCoverage | null;
  organization: Organization | null;
  owner: UserRef | null;
  uri: string;
  extras: Record<string, unknown> | null;
}

export interface TopicElementRef {
  class: "Dataset" | "Reuse" | "Dataservice";
  id: string;
}

export interface TopicElement {
  id: string;
  title: string | null;
  description: string | null;
  tags: string[] | null;
  extras: Record<string, unknown> | null;
  element: TopicElementRef | null;
}

export interface TopicCreatePayload {
  name: string;
  description?: string;
  tags?: string[];
  featured?: boolean;
  private?: boolean;
}

export interface TopicUpdatePayload {
  name?: string;
  description?: string;
  tags?: string[];
  featured?: boolean;
  private?: boolean;
}

export interface TopicElementCreatePayload {
  class: "Dataset" | "Reuse" | "Dataservice";
  id: string;
}


