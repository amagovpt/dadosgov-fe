import type { Organization, UserRef } from '@/service/types/identity';
import type { SchemaRef } from '@/service/types/shared';
import type { DatasetRef } from '@/service/types/dataset';

export interface CommunityResourcePermissions {
  edit: boolean;
  delete: boolean;
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
  // Backend-computed authorization for the current user (single source of truth).
  permissions?: CommunityResourcePermissions;
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

