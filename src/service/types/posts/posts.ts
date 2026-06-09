import type { UserRef } from '@/service/types/identity';

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
