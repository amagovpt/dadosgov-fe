
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

