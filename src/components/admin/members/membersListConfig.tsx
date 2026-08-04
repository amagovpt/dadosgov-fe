import { Icon } from "@ama-pt/agora-design-system";
import StatusDot from "@/components/admin/StatusDot";
import TextLink from "@/components/Primitives/TextLink";
import type { AdminListColumn } from "@/components/admin/lists/AdminListTable";
import {
  createDateSorter,
  createLocaleStringSorter,
  sortItems,
} from "@/utils/admin-lists/listHelpers";
import type { OrganizationMember } from "@/service/types/identity";
import { formatDateToDMY } from "@/utils/formatDate";

const rolePillVariant = (role: string) => {
  switch (role) {
    case "admin":
      return "informative" as const;
    case "editor":
      return "success" as const;
    default:
      return "neutral" as const;
  }
};

export type MemberSortField = "name" | "since";

interface MemberColumnsOptions {
  isOrgAdmin: boolean;
  labels: {
    member: string;
    role: string;
    since: string;
    actions: string;
    editRole: string;
    removeMember: string;
    adminRole: string;
    editorRole: string;
  };
  onEditRole: (member: OrganizationMember) => void;
  onRemoveMember: (member: OrganizationMember) => void;
}

export function sortMembers(
  members: OrganizationMember[],
  sortField: MemberSortField | null,
  sortOrder: "none" | "ascending" | "descending"
) {
  return sortItems(members, sortField, sortOrder, {
    name: createLocaleStringSorter(
      (member) => `${member.user.first_name ?? ""} ${member.user.last_name ?? ""}`.trim()
    ),
    since: createDateSorter((member) => member.since),
  });
}

export function createMemberColumns({
  isOrgAdmin,
  labels,
  onEditRole,
  onRemoveMember,
}: MemberColumnsOptions): AdminListColumn<OrganizationMember, MemberSortField>[] {
  const roleLabels: Record<string, string> = {
    admin: labels.adminRole,
    editor: labels.editorRole,
  };

  const columns: AdminListColumn<OrganizationMember, MemberSortField>[] = [
    {
      id: "member",
      header: labels.member,
      headerLabel: labels.member,
      sortField: "name",
      sortType: "string",
      renderCell: (member) => (
        <div className="flex items-center gap-8">
          {member.user.avatar_thumbnail ? (
            <img
              src={member.user.avatar_thumbnail}
              alt={`${member.user.first_name} ${member.user.last_name}`}
              className="h-32 w-32 rounded-full"
            />
          ) : (
            <Icon name="agora-line-user" className="h-32 w-32" />
          )}
          <div>
            <TextLink href={`/users/${member.user.slug}`}>
              {member.user.first_name} {member.user.last_name}
            </TextLink>
          </div>
        </div>
      ),
    },
    {
      id: "role",
      header: labels.role,
      renderCell: (member) => (
        <StatusDot variant={rolePillVariant(member.role)}>
          {roleLabels[member.role] || member.role}
        </StatusDot>
      ),
    },
    {
      id: "since",
      header: labels.since,
      sortField: "since",
      sortType: "date",
      renderCell: (member) => formatDateToDMY(member.since),
    },
  ];

  if (isOrgAdmin) {
    columns.push({
      id: "actions",
      header: labels.actions,
      headerLabel: labels.actions,
      renderCell: (member) => (
        <div className="flex gap-8">
          <button onClick={() => onEditRole(member)} title={labels.editRole}>
            <Icon
              name="agora-line-edit"
              className="h-[20px] w-[20px] cursor-pointer text-primary-600"
            />
          </button>
          <button onClick={() => onRemoveMember(member)} title={labels.removeMember}>
            <Icon
              name="agora-line-trash"
              className="h-[20px] w-[20px] cursor-pointer text-danger-600"
            />
          </button>
        </div>
      ),
    });
  }

  return columns;
}
