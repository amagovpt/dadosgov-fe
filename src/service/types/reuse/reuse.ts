import type { Badge, Organization, UserRef } from '@/service/types/identity';
import type { Metric } from '@/service/types/shared/core';
import type { DatasetRef } from '@/service/types/dataset';
import type { Dataservice } from '@/service/types/dataservice';

export interface ReuseType {
  id: string;
  label: string;
}

export interface ReuseSuggestion {
  id: string;
  title: string;
  slug: string;
  image_url: string | null;
  score: number;
}

export interface ReuseFilters {
  q?: string;
  type?: string;
  tag?: string | string[];
  organization?: string | string[];
  owner?: string;
  dataset?: string;
  sort?: string;
  modified_since?: string;
}

export interface ReuseTopic {
  id: string;
  label: string;
}

export interface Reuse {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: string;
  url: string;
  image: string | null;
  image_thumbnail: string | null;
  organization: Organization | null;
  owner: UserRef | null;
  private: boolean;
  featured: boolean;
  archived: string | null;
  deleted?: string | null;
  topic: string | null;
  created_at: string;
  last_modified: string;
  metrics: Metric;
  tags: string[];
  badges: Badge[];
  datasets: DatasetRef[];
  dataservices: Dataservice[];
  extras?: Record<string, unknown>;
}

export interface ReuseCreatePayload {
  title: string;
  description: string;
  url: string;
  type: string;
  topic?: string;
  tags?: string[];
  organization?: string;
  private?: boolean;
}

export interface ReuseUpdatePayload {
  title?: string;
  description?: string;
  url?: string;
  type?: string;
  topic?: string;
  tags?: string[];
  organization?: string;
  private?: boolean;
  archived?: string | null;
  extras?: Record<string, unknown>;
}

