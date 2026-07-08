import type { Organization, UserRef } from '@/service/types/identity';
import type { Metric } from '@/service/types/shared';
import type { DatasetRef } from '@/service/types/dataset';

/**
 * Access audience entry for restricted dataservices.
 * `role` mirrors the backend AccessAudienceType
 * (local_authority_and_administration | company_and_association | private)
 * and `condition` the AccessAudienceCondition (yes | no | under_condition).
 */

export interface DataservicePermissions {
  edit: boolean;
  delete: boolean;
  read: boolean;
}


export interface AccessAudience {
  role: string;
  condition: string;
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
  access_audiences?: AccessAudience[];
  access_type_reason_category?: string | null;
  access_type_reason?: string | null;
  format: string | null;
  license: string | null;
  organization: Organization | null;
  owner: UserRef | null;
  created_at: string;
  last_modified: string;
  // The list endpoint serialises the modification timestamp as
  // metadata_modified_at; last_modified may be absent there.
  metadata_modified_at?: string | null;
  archived_at: string | null;
  deleted_at: string | null;
  metrics: Metric;
  tags: string[];
  private: boolean;
  featured: boolean;
  datasets: DatasetRef[];
  // Backend-computed authorization for the current user (single source of truth).
  permissions?: DataservicePermissions;
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
  rate_limiting_url?: string;
  availability?: number;
  access_type?: string;
  access_audiences?: AccessAudience[];
  access_type_reason_category?: string;
  access_type_reason?: string;
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
  rate_limiting_url?: string;
  availability?: number;
  access_type?: string;
  access_audiences?: AccessAudience[];
  access_type_reason_category?: string;
  access_type_reason?: string;
  format?: string;
  license?: string;
  tags?: string[];
  organization?: string;
  private?: boolean;
  archived_at?: string | null;
  datasets?: string[];
}

