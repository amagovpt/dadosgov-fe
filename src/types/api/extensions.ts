import type {
  Dataset,
  DatasetRef,
  Organization,
  Reuse,
  SchemaRef,
  UserPublic,
  UserRef,
} from "./catalog";


export interface GlobalSearchSuggestion {
  title: string;
  slug: string;
  score: number;
}

export interface DatasetSuggestion {
  id: string;
  title: string;
  slug: string;
  acronym: string | null;
  image_url: string | null;
  page: string;
}

export interface DiscussionUser {
  id: string;
  first_name: string;
  last_name: string;
  slug: string;
  avatar: string | null;
  avatar_thumbnail: string | null;
  page: string;
  uri: string;
}

export interface DiscussionMessage {
  content: string;
  posted_by: DiscussionUser;
  posted_by_organization: unknown | null;
  posted_on: string;
  last_modified_at: string | null;
  permissions: {
    delete: boolean;
    edit: boolean;
  };
  spam: {
    status: string | null;
  };
}

export interface Discussion {
  id: string;
  title: string;
  url: string;
  created: string;
  closed: string | null;
  closed_by: DiscussionUser | null;
  closed_by_organization: unknown | null;
  subject: {
    class: string;
    id: string;
  };
  user: DiscussionUser;
  discussion: DiscussionMessage[];
  organization: unknown | null;
  permissions: {
    close: boolean;
    delete: boolean;
    edit: boolean;
  };
  spam: {
    status: string | null;
  };
  extras: Record<string, unknown>;
}

export interface DiscussionCreatePayload {
  title: string;
  comment: string;
  subject: {
    class: string;
    id: string;
  };
  organization?: string;
}

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

export interface DiscussionNotificationDetails {
  discussion: string | null;
  status: string | null;
  message_id: string | null;
}

export interface MembershipRequestNotificationDetails {
  request_organization: Organization | null;
  request_user: UserRef | null;
}

export interface TransferRequestNotificationDetails {
  transfer_owner: object | null;
  transfer_recipient: object | null;
  transfer_subject: object | null;
}

export interface ValidateHarvesterNotificationSource {
  id: string;
  name: string;
  slug: string;
}

export interface ValidateHarvesterNotificationDetails {
  source: ValidateHarvesterNotificationSource | null;
  status: "pending" | "accepted" | "refused";
}

export type NotificationDetails =
  | DiscussionNotificationDetails
  | MembershipRequestNotificationDetails
  | TransferRequestNotificationDetails
  | ValidateHarvesterNotificationDetails;

export interface Notification {
  id: string;
  created_at: string;
  last_modified: string;
  handled_at: string | null;
  user: UserRef | null;
  details: NotificationDetails;
}

export interface ReportReason {
  value: string;
  label: string;
}

export interface ReportCreatePayload {
  subject: { class: string; id: string };
  reason: string;
  message?: string;
}

export interface Report {
  id: string;
  by: UserRef | null;
  subject: { class: string; id: string };
  reason: string;
  message: string | null;
  reported_at: string;
  dismissed_at: string | null;
  dismissed_by: UserRef | null;
  subject_deleted_at: string | null;
  self_api_url: string;
}

export type FollowableEntityType = "datasets" | "organizations" | "reuses";

export interface Follow {
  id: string;
  follower: UserRef;
  since: string;
}

export interface FollowResponse {
  followers: number;
}

export interface UserFollowing {
  id: string;
  follower: UserRef;
  following: {
    id: string;
    class: string;
    name?: string;
    title?: string;
    slug?: string;
    avatar_thumbnail?: string | null;
    image_thumbnail?: string | null;
  };
  since: string;
}

export interface CommunityResource {
  id: string;
  title: string;
  description: string | null;
  url: string;
  filetype: string | null;
  type: string | null;
  format: string | null;
  filesize: number | null;
  mime: string | null;
  checksum: { type: string; value: string } | null;
  dataset: DatasetRef | null;
  organization: Organization | null;
  owner: UserRef | null;
  created_at: string;
  last_modified: string;
  archived: boolean;
  deleted: boolean;
  schema: SchemaRef | null;
}

export interface CommunityResourceCreatePayload {
  title: string;
  description?: string;
  url: string;
  filetype?: "file" | "remote";
  type?: string;
  format?: string;
  dataset: string;
  organization?: string;
  schema?: { name?: string; url?: string; version?: string } | null;
}

export interface CommunityResourceUpdatePayload {
  title?: string;
  description?: string;
  url?: string;
  filetype?: string;
  type?: string;
  format?: string;
  mime?: string;
  filesize?: number;
  dataset?: string;
  schema?: { name?: string; url?: string; version?: string } | null;
  checksum?: { type: string; value: string } | null;
}

export interface HarvestError {
  message: string;
  details: string | null;
}

export interface HarvestItem {
  remote_id: string;
  remote_url: string | null;
  dataset: { id: string; title: string; page: string } | null;
  status: "pending" | "started" | "done" | "failed" | "skipped" | "archived";
  errors: HarvestError[];
}

export interface HarvestJob {
  id: string;
  status: "pending" | "initializing" | "initialized" | "started" | "processing" | "done" | "done-errors" | "failed";
  created: string | null;
  started: string | null;
  ended: string | null;
  errors: Record<string, unknown>[];
  items: HarvestItem[];
  source: string;
}

export interface HarvestSourceValidation {
  state: "pending" | "accepted" | "refused";
  by: UserRef | null;
  on: string | null;
  comment: string | null;
}

export type HarvestValidationDecision = "accepted" | "refused";

export interface HarvestValidationPayload {
  state: HarvestValidationDecision;
  comment?: string;
}

export interface HarvestPreviewJob {
  id: string;
  status:
  | "pending"
  | "initializing"
  | "initialized"
  | "processing"
  | "done"
  | "done-errors"
  | "failed";
  created: string;
  started: string | null;
  ended: string | null;
  errors: HarvestError[];
  items: HarvestItem[];
  source: string;
}

export interface HarvestSource {
  id: string;
  name: string;
  description: string | null;
  url: string;
  backend: string;
  organization: Organization | null;
  schedule: string | null;
  config: Record<string, unknown>;
  filters: Record<string, unknown>[];
  features: Record<string, boolean>;
  active: boolean;
  autoarchive: boolean;
  validation: HarvestSourceValidation | null;
  created_at: string;
  last_modified: string;
  last_job: HarvestJob | null;
  datasets_count: number;
}

export interface HarvestSourceCreatePayload {
  name: string;
  description?: string;
  url: string;
  backend: string;
  organization?: string;
  schedule?: string;
  config?: Record<string, unknown>;
  filters?: Record<string, unknown>[];
  features?: Record<string, boolean>;
  active?: boolean;
  autoarchive?: boolean;
}

export interface HarvestSourceUpdatePayload {
  name?: string;
  description?: string;
  url?: string;
  backend?: string;
  organization?: string;
  schedule?: string;
  config?: Record<string, unknown>;
  filters?: Record<string, unknown>[];
  features?: Record<string, boolean>;
  active?: boolean;
  autoarchive?: boolean;
}

export interface HarvestBackend {
  id: string;
  label: string;
  filters: { label: string; key: string; type: string; description: string }[];
  features: { label: string; key: string; description: string; default: boolean }[];
  extra_configs: { label: string; key: string; description: string; default: string }[];
}

export type UserRole = string;

export interface UserAdmin extends UserPublic {
  datasets_count: number;
  reuses_count: number;
  last_login: string | null;
}

export interface UserAdminUpdatePayload {
  first_name?: string;
  last_name?: string;
  about?: string;
  website?: string;
  roles?: UserRole[];
  active?: boolean;
}

export interface UserSuggestion {
  id: string;
  first_name: string;
  last_name: string;
  slug: string;
  avatar_thumbnail: string | null;
  score: number;
}

export interface HomeContent {
  featured_datasets: Dataset[];
  featured_reuses: Reuse[];
}

export interface APIResponse<T> {
  data: T[];
  page: number;
  page_size: number;
  total: number;
  next_page: string | null;
  previous_page: string | null;
  error?: boolean;
  errorStatus?: number | "network";
}

export type TransferStatus = "pending" | "accepted" | "refused";

export type TransferSubjectClass = "Dataset" | "Reuse" | "Dataservice";

export type TransferRecipientClass = "User" | "Organization";

export interface TransferRef {
  class: string;
  id: string;
}

export interface Transfer {
  id: string;
  user?: UserRef | null;
  owner?: UserRef | { id: string; name: string; slug: string } | null;
  recipient?: UserRef | { id: string; name: string; slug: string } | null;
  subject?: { id: string; title?: string; slug?: string } | null;
  comment: string;
  response_comment?: string | null;
  status: TransferStatus;
  created: string;
  responded?: string | null;
}

export interface TransferRequestPayload {
  subject: { class: TransferSubjectClass; id: string };
  recipient: { class: TransferRecipientClass; id: string };
  comment?: string;
}

export interface SystemLogFile {
  name: string;
  size: number;
  modified: string;
}

export interface SystemLogContent extends SystemLogFile {
  truncated: boolean;
  content: string;
}
