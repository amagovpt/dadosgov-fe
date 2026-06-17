import type { Organization, UserRef } from '@/service/types/identity';
import type { Metric } from '@/service/types/shared';
import type { DatasetRef } from '@/service/types/dataset';

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
  archived?: string | null;
  datasets?: string[];
}

