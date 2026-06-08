import type { Organization, UserRef } from '@/service/types/identity';

export interface License {
  id: string;
  title: string;
  url: string | null;
  maintainer: string | null;
  flags: string[];
  alternate_titles: string[];
  alternate_urls: string[];
}

export interface Frequency {
  id: string;
  label: string;
}

export interface DatasetBadges {
  [key: string]: string;
}

export interface ResourceType {
  id: string;
  label: string;
}

export interface Activity {
  actor: UserRef;
  organization: Organization | null;
  related_to: string;
  related_to_id: string;
  related_to_kind: string;
  related_to_url: string;
  created_at: string;
  label: string;
  key: string;
  icon: string;
  changes: string[];
  extras: Record<string, unknown>;
}

export interface TagSuggestion {
  text: string;
}

export interface FormatSuggestion {
  text: string;
}

export interface SpatialZone {
  id: string;
  name: string;
  code: string;
  level: string;
  uri: string;
}

export interface Granularity {
  id: string;
  name: string;
}

export interface GeoLevel {
  id: string;
  name: string;
}

