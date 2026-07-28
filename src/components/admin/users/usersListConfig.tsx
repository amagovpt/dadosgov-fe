import { Icon } from "@ama-pt/agora-design-system";
import TextLink from "@/components/Primitives/TextLink";
import type { AdminListColumn } from "@/components/admin/lists/AdminListTable";
import { createTableActionsColumn } from "@/utils/admin-lists/listColumnHelpers";
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

export interface UserColumnLabels {
  name: string;
  createdAt: string;
  datasets: string;
  reuses: string;
  followers: string;
  profile: string;
  profileAdmin: string;
  profileEditor: string;
}

const getUserProfile = (user: UserAdmin, labels: UserColumnLabels): string => {
  if (user.roles?.includes("admin")) return labels.profileAdmin;
  return labels.profileEditor;
};

export function createUserColumns(
  labels: UserColumnLabels
): AdminListColumn<UserAdmin, UserSortField>[] {
  return [
    {
      id: "name",
      header: labels.name,
      sortField: "name",
      sortType: "string",
      renderCell: (user) => (
        <div>
          <TextLink href={`/users/${user.slug}`}>
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
      header: labels.createdAt,
      sortField: "created_at",
      sortType: "date",
      renderCell: (user) => formatDateToDMY(user.since),
    },
    {
      id: "datasets",
      header: labels.datasets,
      sortField: "datasets",
      sortType: "numeric",
      renderCell: (user) => user.datasets_count ?? 0,
    },
    {
      id: "reuses",
      header: labels.reuses,
      sortField: "reuses",
      sortType: "numeric",
      renderCell: (user) => user.reuses_count ?? 0,
    },
    {
      id: "followers",
      header: labels.followers,
      sortField: "followers",
      sortType: "numeric",
      renderCell: (user) => user.metrics?.followers ?? 0,
    },
    {
      id: "profile",
      header: labels.profile,
      renderCell: (user) => getUserProfile(user, labels),
    },
    createTableActionsColumn<UserAdmin>({
      viewAction: (user) => ({
        href: `/users/${user.slug}`,
      }),
      editAction: (user) => ({
        href: `/admin/users/${user.id}/profile`,
      }),
    }),
  ];
}
