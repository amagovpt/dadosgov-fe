export interface SiteMetrics {
  datasets: number;
  dataservices?: number;
  organizations: number;
  reuses: number;
  users: number;
}

export interface SiteInfo {
  id: string;
  title?: string;
  metrics: SiteMetrics;
}

export interface SiteConfigUpdatePayload {
  title?: string;
  [key: string]: unknown;
}
