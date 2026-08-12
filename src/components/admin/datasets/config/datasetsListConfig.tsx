import { ProgressBar } from "@ama-pt/agora-design-system";
import { ResourceStatusBadge } from "@/components/admin/ResourceStatusBadge";
import TextLink from "@/components/Primitives/TextLink";
import TableActionsCell from "@/components/admin/TableActionsCell";
import { can } from "@/utils/permissions";
import { calculateQualityScore } from "@/utils/calculateQualityScore";
import { QUALITY_CRITERIA } from "@/utils/datasetQuality";
import { getResourceStatusSortValue } from "@/utils/admin-lists/listHelpers";
import type { Dataset } from "@/service/types/dataset";
import type { SortOrder } from "@/hooks/admin-lists/useClientTableState";
import type { AdminListColumn } from "@/components/admin/lists/AdminListTable";

export type DatasetSortField =
  | "title"
  | "status"
  | "created_at"
  | "last_modified"
  | "resources"
  | "quality";
export type OrgDatasetSortField = "title" | "status" | "created" | "last_update" | "quality";

export interface DatasetColumnLabels {
  title: string;
  titleShort: string;
  status: string;
  createdAt: string;
  lastModified: string;
  resources: string;
  quality: string;
  actions: string;
}

export const systemDatasetSortFieldMap: Record<DatasetSortField, string | null> = {
  title: "title",
  status: null,
  created_at: "created",
  last_modified: "last_update",
  resources: null,
  quality: null,
};

export function sortDatasets(
  items: Dataset[],
  sortField: DatasetSortField | null,
  sortOrder: SortOrder,
): Dataset[] {
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
      case "created_at":
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case "last_modified":
        comparison = new Date(a.last_modified).getTime() - new Date(b.last_modified).getTime();
        break;
      case "resources":
        comparison = (a.resources?.length || 0) - (b.resources?.length || 0);
        break;
      case "quality":
        comparison =
          calculateQualityScore(QUALITY_CRITERIA, a.quality) -
          calculateQualityScore(QUALITY_CRITERIA, b.quality);
        break;
      default:
        comparison = 0;
    }
    return sortOrder === "descending" ? -comparison : comparison;
  });
}

export function formatDatasetDate(dateStr: string) {
  try {
    const date = new Date(dateStr);
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

type DatasetSortVariant = "system" | "org";

type DatasetColumnField<TVariant extends DatasetSortVariant> = TVariant extends "org"
  ? OrgDatasetSortField
  : DatasetSortField;

interface DatasetColumnsOptions<TVariant extends DatasetSortVariant = "system"> {
  editHref: (dataset: Dataset) => string;
  showOwner?: boolean;
  showOrganizationFallback?: boolean;
  showResourceCount?: boolean;
  showQualityScore?: boolean;
  sortVariant?: TVariant;
  labels: DatasetColumnLabels;
}

export function createDatasetColumns<TVariant extends DatasetSortVariant = "system">({
  editHref,
  showOwner = false,
  showOrganizationFallback = false,
  showResourceCount = false,
  showQualityScore = false,
  sortVariant = "system" as TVariant,
  labels,
}: DatasetColumnsOptions<TVariant>): AdminListColumn<Dataset, DatasetColumnField<TVariant>>[] {
  const createdSortField = (
    sortVariant === "org" ? "created" : "created_at"
  ) as DatasetColumnField<TVariant>;
  const lastModifiedSortField = (
    sortVariant === "org" ? "last_update" : "last_modified"
  ) as DatasetColumnField<TVariant>;

  const columns: AdminListColumn<Dataset, DatasetColumnField<TVariant>>[] = [
    {
      id: "title",
      header: labels.title,
      headerLabel: labels.titleShort,
      sortField: "title" as DatasetColumnField<TVariant>,
      sortType: "date",
      renderCell: (dataset) => (
        <TextLink href={`/datasets/${dataset.slug}`}>{dataset.title}</TextLink>
      ),
    },
    {
      id: "status",
      header: labels.status,
      sortField: "status" as DatasetColumnField<TVariant>,
      sortType: "string",
      renderCell: (dataset) => <ResourceStatusBadge item={dataset} />,
    },
    {
      id: "created_at",
      header: labels.createdAt,
      sortField: createdSortField,
      sortType: "date",
      renderCell: (dataset) => formatDatasetDate(dataset.created_at),
    },
    {
      id: "last_modified",
      header: labels.lastModified,
      sortField: lastModifiedSortField,
      sortType: "date",
      renderCell: (dataset) => (
        <div>
          <div>{formatDatasetDate(dataset.last_modified)}</div>
          {showOwner && dataset.owner && (
            <TextLink href={`/users/${dataset.owner.slug}`} className="text-xs">
              {dataset.owner.first_name} {dataset.owner.last_name}
            </TextLink>
          )}
          {!dataset.owner && showOrganizationFallback && dataset.organization && (
            <TextLink href={`/organizations/${dataset.organization.slug}`} className="text-xs">
              {dataset.organization.name}
            </TextLink>
          )}
        </div>
      ),
    },
  ];

  if (showResourceCount) {
    columns.push({
      id: "resources",
      header: labels.resources,
      headerLabel: labels.resources,
      sortField: "resources" as DatasetColumnField<TVariant>,
      sortType: "date",
      renderCell: (dataset) => dataset.resources?.length || 0,
    });
  }

  if (showQualityScore) {
    columns.push({
      id: "quality",
      header: labels.quality,
      headerLabel: labels.quality,
      sortField: "quality" as DatasetColumnField<TVariant>,
      sortType: "numeric",
      renderCell: (dataset) => {
        const score = calculateQualityScore(QUALITY_CRITERIA, dataset.quality);
        return (
          <>
            <div
              className={
                score <= 45
                  ? "quality-progress-warning"
                  : score > 50
                    ? "quality-progress-success"
                    : ""
              }
            >
              <ProgressBar value={score} max={100} hidePercentageValue={true} />
            </div>
            <span className="text-xs text-neutral-700">{score}%</span>
          </>
        );
      },
    });
  }

  columns.push({
    id: "actions",
    header: labels.actions,
    headerLabel: labels.actions,
    renderCell: (dataset) => (
      <TableActionsCell
        viewAction={{ href: `/datasets/${dataset.slug}` }}
        editAction={can(dataset, "edit") ? { href: editHref(dataset) } : undefined}
      />
    ),
  });

  return columns;
}
