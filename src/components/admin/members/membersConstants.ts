export const MEMBER_ROLES = ["admin", "editor"] as const;

export type MemberRole = (typeof MEMBER_ROLES)[number];

export const ROLE_LABELS: Record<MemberRole, string> = {
  admin: "Administrador",
  editor: "Editor",
};

export const DEFAULT_MEMBER_ROLE: MemberRole = "editor";
