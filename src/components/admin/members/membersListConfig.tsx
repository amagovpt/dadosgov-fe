import { Icon } from "@ama-pt/agora-design-system";
import StatusDot from "@/components/admin/StatusDot";
import TextLink from "@/components/Primitives/TextLink";
import type { AdminListColumn } from "@/components/admin/lists/AdminListTable";
import {
  createDateSorter,
  createLocaleStringSorter,
  sortItems,
} from "@/components/admin/lists/listHelpers";
import type { OrganizationMember } from "@/service/types/identity";
import { formatDateToDMY } from "@/utils/formatDate";

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  editor: "Editor",
};

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
  onEditRole,
  onRemoveMember,
}: MemberColumnsOptions): AdminListColumn<OrganizationMember, MemberSortField>[] {
  const columns: AdminListColumn<OrganizationMember, MemberSortField>[] = [
    {
      id: "member",
      header: "Membros",
      headerLabel: "Membros",
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
            <TextLink href={`/pages/users/${member.user.slug}`}>
              {member.user.first_name} {member.user.last_name}
            </TextLink>
          </div>
        </div>
      ),
    },
    {
      id: "role",
      header: "Estatuto",
      renderCell: (member) => (
        <StatusDot variant={rolePillVariant(member.role)}>
          {roleLabels[member.role] || member.role}
        </StatusDot>
      ),
    },
    {
      id: "since",
      header: "Membro desde",
      sortField: "since",
      sortType: "date",
      renderCell: (member) => formatDateToDMY(member.since),
    },
  ];

  if (isOrgAdmin) {
    columns.push({
      id: "actions",
      header: "Ações",
      headerLabel: "Ações",
      renderCell: (member) => (
        <div className="flex gap-8">
          <button onClick={() => onEditRole(member)} title="Editar papel">
            <Icon
              name="agora-line-edit"
              className="h-[20px] w-[20px] cursor-pointer text-primary-600"
            />
          </button>
          <button onClick={() => onRemoveMember(member)} title="Remover membro">
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
