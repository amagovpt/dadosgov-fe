import StatusDot from "@/components/admin/StatusDot";
import { ResourceStatusBadge } from "@/components/admin/ResourceStatusBadge";
import TextLink from "@/components/Primitives/TextLink";
import TableActionsCell from "@/components/admin/TableActionsCell";
import { formatDateToDMY } from "@/utils/formatDate";
import { can } from "@/utils/permissions";
import { getResourceStatusSortValue } from "@/utils/admin-lists/listHelpers";
import type { CommunityResource } from "@/service/types/community-resource";
import type { SortOrder } from "@/hooks/admin-lists/useClientTableState";
import type { AdminListColumn } from "@/components/admin/lists/AdminListTable";

export type CommunityResourceSortField =
  | "title"
  | "status"
  | "format"
  | "created_at"
  | "last_modified";
export type OrgCommunityResourceSortField = "title" | "status" | "created_at" | "last_modified";

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
      case "status":
        comparison = getResourceStatusSortValue(a) - getResourceStatusSortValue(b);
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
  labels: CommunityResourceColumnLabels;
  editHref: (resource: CommunityResource) => string;
}

interface CommunityResourceColumnLabels {
  title: string;
  status: string;
  format: string;
  createdAt: string;
  modifiedAt: string;
  lastModified: string;
  action: string;
  actions: string;
  deleted: string;
  archived: string;
  published: string;
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
  titleHeader,
  titleCellStyle = "neutral",
  showDatasetLink = false,
  useSystemStatusDot = false,
  showOwnerOnLastModified = false,
  labels,
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
      header: titleHeader ?? labels.title,
      headerLabel: labels.title,
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
              <TextLink href={`/datasets/${resource.dataset.id}`} className="text-sm">
                {resource.dataset.title}
              </TextLink>
            </>
          )}
        </div>
      ),
    },
    {
      id: "status",
      header: labels.status,
      sortField: "status" as CommunityResourceColumnField<TIncludeFormat>,
      sortType: "string",
      renderCell: (resource) =>
        useSystemStatusDot ? (
          <StatusDot
            variant={resource.deleted ? "danger" : resource.archived ? "warning" : "success"}
          >
            {resource.deleted
              ? labels.deleted
              : resource.archived
                ? labels.archived
                : labels.published}
          </StatusDot>
        ) : (
          <ResourceStatusBadge item={resource} />
        ),
    },
  ];

  if (includeFormat) {
    columns.push({
      id: "format",
      header: labels.format,
      headerLabel: labels.format,
      sortField: "format" as CommunityResourceColumnField<TIncludeFormat>,
      sortType: "date",
      renderCell: (resource) =>
        useSystemStatusDot ? resource.format?.toUpperCase() || "—" : resource.format || "—",
    });
  }

  columns.push(
    {
      id: "created_at",
      header: labels.createdAt,
      headerLabel: labels.createdAt,
      sortField: "created_at" as CommunityResourceColumnField<TIncludeFormat>,
      sortType: "date",
      renderCell: (resource) => formatDateToDMY(resource.created_at),
    },
    {
      id: "last_modified",
      header: useSystemStatusDot ? labels.modifiedAt : labels.lastModified,
      headerLabel: useSystemStatusDot ? labels.modifiedAt : labels.lastModified,
      sortField: "last_modified" as CommunityResourceColumnField<TIncludeFormat>,
      sortType: "date",
      renderCell: (resource) =>
        showOwnerOnLastModified ? (
          <div>
            <div>{formatDateToDMY(resource.last_modified)}</div>
            {resource.owner && (
              <a
                href={`/users/${resource.owner.slug}`}
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
      header: useSystemStatusDot ? labels.action : labels.actions,
      headerLabel: useSystemStatusDot ? labels.action : labels.actions,
      renderCell: (resource) => (
        <TableActionsCell
          editAction={can(resource, "edit") ? { href: editHref(resource) } : undefined}
        />
      ),
    }
  );

  return columns;
}

