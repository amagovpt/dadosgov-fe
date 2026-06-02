export interface ApiToken {
  id: string;
  token_prefix: string;
  name: string | null;
  scopes: string[];
  kind: string;
  created_at: string;
  last_used_at: string | null;
  user_agents: string[];
  revoked_at: string | null;
  expires_at: string | null;
}

export interface ApiTokenCreated extends ApiToken {
  token: string;
}

export interface UserRef {
  id: string;
  slug: string;
  first_name: string;
  last_name: string;
  avatar: string | null;
  avatar_thumbnail: string | null;
  uri: string;
  page: string;
  saml_login?: boolean;
  roles?: string[];
  organizations?: Organization[];
  last_modified?: string;
}

export interface UserMetrics {
  datasets: number;
  followers: number;
  reuses: number;
  views: number;
  downloads: number;
}

export interface UserUpdatePayload {
  first_name?: string;
  last_name?: string;
  about?: string;
  website?: string;
}

export interface OrgInvitation {
  id: string;
  organization: Organization | null;
  status: "pending" | "accepted" | "refused";
  created: string;
}

export interface UserPublic {
  id: string;
  slug: string;
  first_name: string;
  last_name: string;
  email: string | null;
  avatar: string | null;
  avatar_thumbnail: string | null;
  website: string | null;
  about: string | null;
  roles: string[];
  active: boolean;
  organizations: Organization[];
  since: string;
  uri: string;
  page: string;
  metrics: UserMetrics;
  apikey: string | null;
}

export interface OrganizationMember {
  user: UserRef;
  role: string;
  label?: string;
  since: string;
}

export interface MembershipRequest {
  id: string;
  user: UserRef;
  created: string;
  status: "pending" | "accepted" | "refused";
  comment: string;
  kind: "request" | "invitation";
  role: string;
}

export interface OrgRole {
  id: string;
  label: string;
}

export interface Badge {
  kind: string;
}

export interface OrganizationMetrics {
  datasets: number;
  dataservices: number;
  followers: number;
  members: number;
  reuses: number;
  views: number;
  resource_downloads: number;
  reuse_views: number;
  dataservice_views: number;
}

export interface Organization {
  id: string;
  name: string;
  acronym: string | null;
  slug: string;
  logo: string | null;
  logo_thumbnail: string | null;
  description: string | null;
  url: string | null;
  business_number_id: string | null;
  members: OrganizationMember[];
  badges: Badge[];
  metrics: OrganizationMetrics;
  created_at: string;
  last_modified: string;
  page: string;
  uri: string;
}

export interface OrganizationCreatePayload {
  name: string;
  acronym?: string;
  description?: string;
  url?: string;
  business_number_id?: string;
}

export interface OrganizationUpdatePayload {
  name?: string;
  acronym?: string | null;
  description?: string;
  url?: string | null;
  business_number_id?: string;
}

export interface OrganizationSuggestion {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  score: number;
}

export interface OrgBadges {
  [kind: string]: string;
}

export interface OrganizationFilters {
  q?: string;
  badge?: string | string[];
  sort?: string;
  organization?: string | string[];
}

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

export interface Dataservice {
  id: string;
  title: string;
  acronym: string | null;
  slug: string;
  description: string;
  base_api_url: string | null;
  machine_documentation_url: string | null;
  technical_documentation_url: string | null;
  business_documentation_url: string | null;
  authorization_request_url: string | null;
  rate_limiting: string | null;
  rate_limiting_url: string | null;
  availability: number | null;
  availability_url: string | null;
  access_type: string | null;
  format: string | null;
  license: string | null;
  organization: Organization | null;
  owner: UserRef | null;
  created_at: string;
  last_modified: string;
  archived: string | null;
  deleted: string | null;
  metrics: Metric;
  tags: string[];
  private: boolean;
  featured: boolean;
  datasets: DatasetRef[];
}

export interface DataserviceCreatePayload {
  title: string;
  description: string;
  acronym?: string;
  base_api_url?: string;
  machine_documentation_url?: string;
  technical_documentation_url?: string;
  business_documentation_url?: string;
  authorization_request_url?: string;
  rate_limiting?: string;
  availability?: number;
  access_type?: string;
  format?: string;
  license?: string;
  tags?: string[];
  organization?: string;
  private?: boolean;
  datasets?: string[];
}

export interface DataserviceUpdatePayload {
  title?: string;
  description?: string;
  acronym?: string;
  base_api_url?: string;
  machine_documentation_url?: string;
  technical_documentation_url?: string;
  business_documentation_url?: string;
  authorization_request_url?: string;
  rate_limiting?: string;
  availability?: number;
  access_type?: string;
  format?: string;
  license?: string;
  tags?: string[];
  organization?: string;
  private?: boolean;
  archived?: string;
  datasets?: string[];
}

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

export interface HomepageData {
  site_metrics: SiteMetrics;
  latest_datasets: Dataset[];
  latest_reuses: Reuse[];
  latest_posts: Post[];
}

export interface SiteConfigUpdatePayload {
  title?: string;
  [key: string]: unknown;
}

export interface Post {
  id: string;
  name: string;
  slug: string;
  headline: string;
  content: string;
  body_type: string;
  kind: string;
  published: string | null;
  owner: UserRef | null;
  image: string | null;
  image_thumbnail: string | null;
  credit_to: string | null;
  credit_url: string | null;
  created_at: string;
  last_modified: string;
  tags: string[];
}

export interface PostCreatePayload {
  name: string;
  headline?: string;
  content?: string;
  body_type?: string;
  kind?: string;
  published?: string;
  tags?: string[];
  credit_to?: string;
  credit_url?: string;
}

export interface PostUpdatePayload {
  name?: string;
  headline?: string;
  content?: string;
  body_type?: string;
  kind?: string;
  published?: string;
  tags?: string[];
  credit_to?: string;
  credit_url?: string;
}
