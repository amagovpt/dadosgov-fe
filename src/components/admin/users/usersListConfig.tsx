import { Icon } from "@ama-pt/agora-design-system";
import TextLink from "@/components/Primitives/TextLink";
import type { AdminListColumn } from "@/components/admin/lists/AdminListTable";
import { createTableActionsColumn } from "@/components/admin/lists/listColumnHelpers";
import { formatDateToDMY } from "@/utils/formatDate";
import type { UserAdmin } from "@/service/types/identity";

export type UserSortField = "name" | "created_at" | "datasets" | "reuses" | "followers";

export const userSortFieldMap: Record<UserSortField, string> = {
  name: "first_name",
  created_at: "created",
  datasets: "datasets",
  reuses: "reuses",
  followers: "followers",
};

const getUserProfile = (user: UserAdmin): string => {
  if (user.roles?.includes("admin")) return "Admin";
  return "Editor";
};

export function createUserColumns(): AdminListColumn<UserAdmin, UserSortField>[] {
  return [
    {
      id: "name",
      header: "Nome",
      sortField: "name",
      sortType: "string",
      renderCell: (user) => (
        <div>
          <TextLink href={`/pages/users/${user.slug}`}>
            {user.first_name} {user.last_name}
          </TextLink>
          {user.email && (
            <div className="text-sm flex items-center gap-4 text-neutral-900">
              <Icon name="agora-line-mail" className="h-[14px] w-[14px]" />
              {user.email}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "created_at",
      header: "Criado em",
      sortField: "created_at",
      sortType: "date",
      renderCell: (user) => formatDateToDMY(user.since),
    },
    {
      id: "datasets",
      header: "Conjuntos de dados",
      sortField: "datasets",
      sortType: "numeric",
      renderCell: (user) => user.datasets_count ?? 0,
    },
    {
      id: "reuses",
      header: "Reutilizações",
      sortField: "reuses",
      sortType: "numeric",
      renderCell: (user) => user.reuses_count ?? 0,
    },
    {
      id: "followers",
      header: "Seguidores",
      sortField: "followers",
      sortType: "numeric",
      renderCell: (user) => user.metrics?.followers ?? 0,
    },
    {
      id: "profile",
      header: "Perfis",
      renderCell: (user) => getUserProfile(user),
    },
    createTableActionsColumn<UserAdmin>({
      viewAction: (user) => ({
        href: `/pages/users/${user.slug}`,
      }),
      editAction: (user) => ({
        href: `/pages/admin/users/${user.id}/profile`,
      }),
    }),
  ];
}
