
export interface Metric {
  nb_hits?: number;
  nb_uniq_visitors?: number;
  nb_visits?: number;
  views?: number;
  followers?: number;
  reuses?: number;
  resources_downloads?: number;
  discussions?: number;
}

export interface Checksum {
  type: string;
  value: string;
}

export interface SchemaRef {
  name: string | null;
  version: string | null;
  url: string | null;
}

export interface TemporalCoverage {
  start: string;
  end?: string;
}

export interface SpatialCoverage {
  geom: object | null;
  zones: string[];
  granularity: string | null;
}

export interface APIResponse<T> {
  data: T[];
  page: number;
  page_size: number;
  total: number;
  next_page: string | null;
  previous_page: string | null;
  // Set to true when the fetch failed (network error, non-2xx, timeout). Lets the
  // UI distinguish a real "no results" from a backend/transport failure.
  error?: boolean;
}

