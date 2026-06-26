import StatusDot from "@/components/admin/StatusDot";
import { ResourceStatusBadge } from "@/components/admin/ResourceStatusBadge";
import TextLink from "@/components/Primitives/TextLink";
import TableActionsCell from "@/components/admin/TableActionsCell";
import { formatDateToDMY } from "@/utils/formatDate";
import { can } from "@/utils/permissions";
import type { CommunityResource } from "@/service/types/community-resource";
import type { SortOrder } from "@/hooks/admin-lists/useClientTableState";
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
    let comparison = 0;
    switch (sortField) {
      case "title":
        comparison = (a.title || "").localeCompare(b.title || "");
        break;
      case "format":
        comparison = (a.format || "").localeCompare(b.format || "");
        break;
      case "created_at":
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case "last_modified":
        comparison = new Date(a.last_modified).getTime() - new Date(b.last_modified).getTime();
        break;
      default:
        comparison = 0;
    }
    return sortOrder === "descending" ? -comparison : comparison;
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

type CommunityResourceColumnField<TIncludeFormat extends boolean> = TIncludeFormat extends true
  ? CommunityResourceSortField
  : OrgCommunityResourceSortField;

type CommunityResourceColumnsOptionsByFormat<TIncludeFormat extends boolean> =
  CommunityResourceColumnsOptions & {
    includeFormat?: TIncludeFormat;
  };

export function createCommunityResourceColumns<TIncludeFormat extends boolean = false>({
  includeFormat = false as TIncludeFormat,
  titleHeader = "Título",
  titleCellStyle = "neutral",
  showDatasetLink = false,
  useSystemStatusDot = false,
  showOwnerOnLastModified = false,
  editHref,
}: CommunityResourceColumnsOptionsByFormat<TIncludeFormat>): AdminListColumn<
  CommunityResource,
  CommunityResourceColumnField<TIncludeFormat>
>[] {
  const columns: AdminListColumn<
    CommunityResource,
    CommunityResourceColumnField<TIncludeFormat>
  >[] = [
    {
      id: "title",
      header: titleHeader,
      headerLabel: "Título",
      sortField: "title" as CommunityResourceColumnField<TIncludeFormat>,
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
      sortField: "format" as CommunityResourceColumnField<TIncludeFormat>,
      sortType: "date",
      renderCell: (resource) =>
        useSystemStatusDot ? resource.format?.toUpperCase() || "—" : resource.format || "—",
    });
  }

  columns.push(
    {
      id: "created_at",
      header: "Criado em",
      headerLabel: "Criado em",
      sortField: "created_at" as CommunityResourceColumnField<TIncludeFormat>,
      sortType: "date",
      renderCell: (resource) => formatDateToDMY(resource.created_at),
    },
    {
      id: "last_modified",
      header: useSystemStatusDot ? "Modificado em" : "Última modificação",
      headerLabel: useSystemStatusDot ? "Modificado em" : "Última modificação",
      sortField: "last_modified" as CommunityResourceColumnField<TIncludeFormat>,
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
      renderCell: (resource) => (
        <TableActionsCell
          editAction={can(resource, "edit") ? { href: editHref(resource) } : undefined}
        />
      ),
    }
  );

  return columns;
}

