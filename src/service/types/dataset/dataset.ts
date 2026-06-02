import type { Badge, Organization, UserRef } from '@/service/types/identity';
import type { Checksum, Metric, SchemaRef, SpatialCoverage, TemporalCoverage } from '@/service/types/shared/core';

export interface Resource {
  id: string;
  title: string;
  description?: string;
  format: string;
  url: string;
  latest?: string;
  filetype?: string;
  type?: string;
  mime?: string;
  filesize?: number;
  checksum?: Checksum | null;
  created_at: string;
  last_modified?: string;
  schema?: SchemaRef | null;
  metrics?: Record<string, number>;
  extras?: Record<string, unknown>;
  preview_url?: string;
}

export interface ResourceCreatePayload {
  title: string;
  description?: string;
  type: string;
  url: string;
  filetype: string;
  format?: string;
  mime?: string;
  filesize?: number;
}

export interface ResourceUpdatePayload {
  title?: string;
  description?: string;
  type?: string;
  url?: string;
  filetype?: string;
  format?: string;
  mime?: string;
  filesize?: number;
}

export interface DatasetPermissions {
  delete: boolean;
  edit: boolean;
  edit_resources: boolean;
}

export interface DatasetQuality {
  all_resources_available: boolean;
  dataset_description_quality: boolean;
  has_open_format: boolean;
  has_resources: boolean;
  license: boolean;
  resources_documentation: boolean;
  score: number;
  spatial: boolean;
  temporal_coverage: boolean;
  update_frequency: boolean;
  update_fulfilled_in_time: boolean;
}

export interface Dataset {
  id: string;
  title: string;
  acronym: string | null;
  slug: string;
  description: string;
  description_short?: string | null;
  organization: Organization | null;
  owner: UserRef | null;
  license: string | null;
  license_title: string | null;
  license_url: string | null;
  frequency: string;
  frequency_date?: string | null;
  temporal_coverage?: TemporalCoverage | null;
  spatial?: SpatialCoverage | null;
  schema?: SchemaRef | null;
  private: boolean;
  featured: boolean;
  archived?: string | null;
  deleted?: string | null;
  last_modified: string;
  last_update?: string;
  created_at: string;
  tags: string[];
  resources: Resource[];
  community_resources?: Resource[];
  badges: Badge[];
  metrics: Metric;
  quality?: DatasetQuality;
  extras?: Record<string, unknown>;
  harvest?: Record<string, unknown> | null;
  contact_points?: ContactPoint[];
  uri: string;
  page: string;
  permissions?: DatasetPermissions;
}

export interface DatasetCreatePayload {
  title: string;
  description: string;
  description_short?: string;
  acronym?: string;
  tags?: string[];
  license?: string;
  frequency?: string;
  frequency_date?: string;
  temporal_coverage?: TemporalCoverage;
  spatial?: SpatialCoverage;
  private?: boolean;
  organization?: string;
  contact_points?: string[];
  extras?: Record<string, unknown>;
}

export interface DatasetUpdatePayload {
  title?: string;
  description?: string;
  description_short?: string;
  acronym?: string;
  tags?: string[];
  license?: string;
  frequency?: string;
  frequency_date?: string;
  temporal_coverage?: TemporalCoverage;
  spatial?: SpatialCoverage;
  private?: boolean;
  featured?: boolean;
  archived?: string | null;
  organization?: string;
  extras?: Record<string, unknown>;
}

export interface DatasetRef {
  id: string;
  title: string;
  page: string;
  uri: string;
}

export interface DatasetSuggestion {
  id: string;
  title: string;
  slug: string;
  acronym: string | null;
  image_url: string | null;
  page: string;
}

export interface ContactPoint {
  id: string;
  name: string;
  email: string;
  contact_form?: string;
  role: string;
  organization?: { id: string; name: string } | null;
  owner?: UserRef | null;
}

export interface ContactPointCreatePayload {
  name: string;
  email?: string;
  contact_form?: string;
  role: string;
  organization?: string;
}

export interface DatasetFilters {
  q?: string;
  tag?: string | string[];
  license?: string | string[];
  format?: string | string[];
  frequency?: string | string[];
  schema?: string;
  geozone?: string;
  granularity?: string;
  organization?: string | string[];
  owner?: string;
  badge?: string | string[];
  featured?: boolean;
  sort?: string;
  private?: boolean;
  archived?: boolean;
  deleted?: boolean;
  modified_since?: string;
}

