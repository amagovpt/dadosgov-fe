import TextLink from "@/components/Primitives/TextLink";
import type { AdminListColumn } from "@/components/admin/lists/AdminListTable";
import { createTableActionsColumn } from "@/utils/admin-lists/listColumnHelpers";
import { formatDateToDMY } from "@/utils/formatDate";
import type { Organization } from "@/service/types/identity";

export type OrganizationSortField = "name" | "created_at";

export const organizationSortFieldMap: Record<OrganizationSortField, string> = {
  name: "name",
  created_at: "created",
};

interface OrganizationColumnsOptions {
  deletingOrgId: string | null;
  onDelete: (organization: Organization) => void;
}

export function createOrganizationColumns({
  deletingOrgId,
  onDelete,
}: OrganizationColumnsOptions): AdminListColumn<Organization, OrganizationSortField>[] {
  return [
    {
      id: "name",
      header: "Nome",
      sortField: "name",
      sortType: "string",
      renderCell: (organization) => (
        <TextLink href={`/pages/admin/org/${organization.id}/profile`}>
          {organization.name}
        </TextLink>
      ),
    },
    {
      id: "created_at",
      header: "Criado em",
      sortField: "created_at",
      sortType: "date",
      renderCell: (organization) => formatDateToDMY(organization.created_at),
    },
    {
      id: "datasets",
      header: "Conjuntos de dados",
      renderCell: (organization) => organization.metrics?.datasets ?? 0,
    },
    {
      id: "reuses",
      header: "Reutilizações",
      renderCell: (organization) => organization.metrics?.reuses ?? 0,
    },
    {
      id: "members",
      header: "Membros",
      renderCell: (organization) => organization.members?.length ?? 0,
    },
    createTableActionsColumn<Organization>({
      viewAction: (organization) => ({
        href: `/pages/organizations/${organization.slug}`,
      }),
      editAction: (organization) => ({
        href: `/pages/admin/org/${organization.id}/profile`,
      }),
      deleteAction: (organization) => ({
        ariaLabel: `Eliminar ${organization.name}`,
        disabled: deletingOrgId === organization.id,
        handler: () => onDelete(organization),
      }),
    }),
  ];
}

