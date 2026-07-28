export const MEMBER_ROLES = ["admin", "editor"] as const;

export type MemberRole = (typeof MEMBER_ROLES)[number];

export const DEFAULT_MEMBER_ROLE: MemberRole = "editor";
