/**
 * Types for the api-tabular preview service (hydra/csv-detective pipeline).
 * Mirrors the payloads relayed by /internal-api/proxy-tabular-data and
 * /internal-api/proxy-tabular-profile.
 */

export interface TabularApiMeta {
  page: number;
  page_size: number;
  total: number;
}

export interface TabularPage {
  /** Row objects keyed by column name (synthetic `__id` already stripped). */
  records: Record<string, unknown>[];
  meta: TabularApiMeta;
}

export interface TabularProfileColumn {
  /** Coarse type: string | int | float | bool | date | datetime | json */
  python_type: string;
  /** Finer csv-detective label (e.g. siren, latitude_wgs, booleen). */
  format: string;
  score?: number;
}

export interface TabularProfile {
  /** Column names in source-file order. */
  header: string[];
  columns: Record<string, TabularProfileColumn>;
  total_lines?: number;
}

export type TabularSortDir = "asc" | "desc";
