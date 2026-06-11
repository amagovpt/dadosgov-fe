import StatusDot from "@/components/admin/StatusDot";
import { ResourceStatusBadge } from "@/components/admin/ResourceStatusBadge";
import TextLink from "@/components/Primitives/TextLink";
import TableActionsCell from "@/components/admin/TableActionsCell";
import { formatDateToDMY } from "@/utils/formatDate";
import type { CommunityResource } from "@/types/api";
import type { SortOrder } from "@/components/admin/lists/useClientTableState";
import type { AdminListColumn } from "@/components/admin/lists/AdminListTable";

export type CommunityResourceSortField = "title" | "format" | "created_at" | "last_modified";
export type OrgCommunityResourceSortField = "title" | "created_at" | "last_modified";

export function sortCommunityResources<T extends CommunityResource>(
  items: T[],
  sortField: CommunityResourceSortField | OrgCommunityResourceSortField | null,
  sortOrder: SortOrder
): T[] {
  if (sortOrder === "none") return items;

  return [...items].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case "title":
        cmp = (a.title || "").localeCompare(b.title || "");
        break;
      case "format":
        cmp = (a.format || "").localeCompare(b.format || "");
        break;
      case "created_at":
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case "last_modified":
        cmp = new Date(a.last_modified).getTime() - new Date(b.last_modified).getTime();
        break;
      default:
        cmp = 0;
    }
    return sortOrder === "descending" ? -cmp : cmp;
  });
}

interface CommunityResourceColumnsOptions {
  includeFormat?: boolean;
  titleHeader?: string;
  titleCellStyle?: "neutral" | "primary";
  showDatasetLink?: boolean;
  useSystemStatusDot?: boolean;
  showOwnerOnLastModified?: boolean;
  editHref: (resource: CommunityResource) => string;
}

export function createCommunityResourceColumns({
  includeFormat = false,
  titleHeader = "Título",
  titleCellStyle = "neutral",
  showDatasetLink = false,
  useSystemStatusDot = false,
  showOwnerOnLastModified = false,
  editHref,
}: CommunityResourceColumnsOptions): AdminListColumn<
  CommunityResource,
  CommunityResourceSortField | OrgCommunityResourceSortField
>[] {
  const columns: AdminListColumn<
    CommunityResource,
    CommunityResourceSortField | OrgCommunityResourceSortField
  >[] = [
    {
      id: "title",
      header: titleHeader,
      headerLabel: "Título",
      sortField: "title",
      sortType: "date",
      renderCell: (resource) => (
        <div>
          <span className={titleCellStyle === "primary" ? "text-primary-600" : "text-neutral-900"}>
            {resource.title}
          </span>
          {showDatasetLink && resource.dataset && (
            <>
              {" "}
              <br />
              <TextLink href={`/pages/datasets/${resource.dataset.id}`} className="text-sm">
                {resource.dataset.title}
              </TextLink>
            </>
          )}
        </div>
      ),
    },
    {
      id: "status",
      header: "Estado",
      renderCell: (resource) =>
        useSystemStatusDot ? (
          <StatusDot
            variant={resource.deleted ? "danger" : resource.archived ? "warning" : "success"}
          >
            {resource.deleted ? "Eliminado" : resource.archived ? "Arquivado" : "Publicado"}
          </StatusDot>
        ) : (
          <ResourceStatusBadge item={resource} />
        ),
    },
  ];

  if (includeFormat) {
    columns.push({
      id: "format",
      header: "Formato",
      headerLabel: "Formato",
      sortField: "format",
      sortType: "date",
      renderCell: (resource) => (useSystemStatusDot ? resource.format?.toUpperCase() || "—" : resource.format || "—"),
    });
  }

  columns.push(
    {
      id: "created_at",
      header: "Criado em",
      headerLabel: "Criado em",
      sortField: "created_at",
      sortType: "date",
      renderCell: (resource) => formatDateToDMY(resource.created_at),
    },
    {
      id: "last_modified",
      header: useSystemStatusDot ? "Modificado em" : "Última modificação",
      headerLabel: useSystemStatusDot ? "Modificado em" : "Última modificação",
      sortField: "last_modified",
      sortType: "date",
      renderCell: (resource) =>
        showOwnerOnLastModified ? (
          <div>
            <div>{formatDateToDMY(resource.last_modified)}</div>
            {resource.owner && (
              <a
                href={`/pages/users/${resource.owner.slug}`}
                className="text-xs text-primary-600 underline"
              >
                {resource.owner.first_name} {resource.owner.last_name}
              </a>
            )}
          </div>
        ) : (
          formatDateToDMY(resource.last_modified)
        ),
    },
    {
      id: "actions",
      header: useSystemStatusDot ? "Ação" : "Ações",
      headerLabel: useSystemStatusDot ? "Ação" : "Ações",
      renderCell: (resource) => <TableActionsCell editAction={{ href: editHref(resource) }} />,
    }
  );

  return columns;
}
