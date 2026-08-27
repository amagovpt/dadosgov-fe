import TextLink from "@/components/Primitives/TextLink";
import type { AdminListColumn } from "@/components/admin/lists/AdminListTable";
import { createTableActionsColumn } from "@/utils/admin-lists/listColumnHelpers";
import { formatDateToDMY } from "@/utils/formatDate";
import type { Organization } from "@/service/types/identity";

export type OrganizationSortField = "name" | "created_at" | "datasets" | "reuses";

export const organizationSortFieldMap: Record<OrganizationSortField, string> = {
  name: "name",
  created_at: "created",
  datasets: "datasets",
  reuses: "reuses",
};

interface OrganizationColumnsOptions {
  deletingOrgId: string | null;
  labels: OrganizationColumnLabels;
  onDelete: (organization: Organization) => void;
}

interface OrganizationColumnLabels {
  name: string;
  createdAt: string;
  datasets: string;
  reuses: string;
  members: string;
  deleteAriaLabel: (name: string) => string;
}

export function createOrganizationColumns({
  deletingOrgId,
  labels,
  onDelete,
}: OrganizationColumnsOptions): AdminListColumn<Organization, OrganizationSortField>[] {
  return [
    {
      id: "name",
      header: labels.name,
      sortField: "name",
      sortType: "string",
      renderCell: (organization) => (
        <TextLink href={`/admin/org/${organization.id}/profile`}>
          {organization.name}
        </TextLink>
      ),
    },
    {
      id: "created_at",
      header: labels.createdAt,
      sortField: "created_at",
      sortType: "date",
      renderCell: (organization) => formatDateToDMY(organization.created_at),
    },
    {
      id: "datasets",
      header: labels.datasets,
      sortField: "datasets",
      sortType: "numeric",
      renderCell: (organization) => organization.metrics?.datasets ?? 0,
    },
    {
      id: "reuses",
      header: labels.reuses,
      sortField: "reuses",
      sortType: "numeric",
      renderCell: (organization) => organization.metrics?.reuses ?? 0,
    },
    {
      id: "members",
      header: labels.members,
      renderCell: (organization) => organization.members?.length ?? 0,
    },
    createTableActionsColumn<Organization>({
      viewAction: (organization) => ({
        href: `/organizations/${organization.slug}`,
      }),
      editAction: (organization) => ({
        href: `/admin/org/${organization.id}/profile`,
      }),
      deleteAction: (organization) => ({
        ariaLabel: labels.deleteAriaLabel(organization.name),
        disabled: deletingOrgId === organization.id,
        handler: () => onDelete(organization),
      }),
    }),
  ];
}

