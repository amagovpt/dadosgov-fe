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

