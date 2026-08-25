import type { Organization, UserRef } from '@/service/types/identity';

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

export interface HarvestJobItemCounts {
  pending: number;
  started: number;
  done: number;
  failed: number;
  skipped: number;
  archived: number;
  total: number;
}

export interface HarvestJob {
  id: string;
  status: "pending" | "initializing" | "initialized" | "started" | "processing" | "done" | "done-errors" | "failed";
  created: string | null;
  started: string | null;
  ended: string | null;
  errors: Record<string, unknown>[];
  // Present on the job detail endpoint (/job/<id>/). The jobs list omits it and
  // returns `item_counts` + `error_items` instead to keep the payload small.
  items?: HarvestItem[];
  // Present on the jobs list endpoint: per-status counts + only the failed items.
  item_counts?: HarvestJobItemCounts;
  error_items?: HarvestItem[];
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

export interface HarvestSourcePermissions {
  edit: boolean;
  delete: boolean;
  run: boolean;
  preview: boolean;
  validate: boolean;
  schedule: boolean;
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
  // Backend-computed authorization for the current user (single source of truth).
  permissions?: HarvestSourcePermissions;
}

export interface HarvestSourceCreatePayload {
  name: string;
  description?: string;
  url: string;
  backend: string;
  organization?: string;
  schedule?: string;
  config?: Record<string, unknown>;
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
  active?: boolean;
  autoarchive?: boolean;
}

export interface HarvestBackend {
  id: string;
  label: string;
  filters: { label: string; key: string; type: string; description: string }[];
  features: { label: string; key: string; description: string; default: boolean }[];
  // `harvest_extra_fields` drops the `type` that `as_dict()` emits and marshals
  // `default` as a string field the backend never sets, so it arrives as null.
  extra_configs: { label: string; key: string; description: string; default: string | null }[];
}

