import { ProgressBar } from "@ama-pt/agora-design-system";
import { ResourceStatusBadge } from "@/components/admin/ResourceStatusBadge";
import TextLink from "@/components/Primitives/TextLink";
import TableActionsCell from "@/components/admin/TableActionsCell";
import { calculateQualityScore } from "@/utils/calculateQualityScore";
import { QUALITY_CRITERIA } from "@/utils/datasetQuality";
import type { Dataset } from "@/types/api";
import type { SortOrder } from "@/components/admin/lists/useClientTableState";
import type { AdminListColumn } from "@/components/admin/lists/AdminListTable";

export type DatasetSortField = "title" | "created_at" | "last_modified" | "resources";
export type OrgDatasetSortField = "title" | "created" | "last_update";

export const systemDatasetSortFieldMap: Record<DatasetSortField, string | null> = {
  title: "title",
  created_at: "created",
  last_modified: "last_update",
  resources: null,
};

export function sortDatasets(
  items: Dataset[],
  sortField: DatasetSortField | null,
  sortOrder: SortOrder
): Dataset[] {
  if (sortOrder === "none") return items;

  return [...items].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "title":
        comparison = (a.title || "").localeCompare(b.title || "");
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
}

export function createDatasetColumns<TVariant extends DatasetSortVariant = "system">({
  editHref,
  showOwner = false,
  showOrganizationFallback = false,
  showResourceCount = false,
  showQualityScore = false,
  sortVariant = "system" as TVariant,
}: DatasetColumnsOptions<TVariant>): AdminListColumn<Dataset, DatasetColumnField<TVariant>>[] {
  const createdSortField = (sortVariant === "org" ? "created" : "created_at") as DatasetColumnField<TVariant>;
  const lastModifiedSortField = (
    sortVariant === "org" ? "last_update" : "last_modified"
  ) as DatasetColumnField<TVariant>;

  const columns: AdminListColumn<Dataset, DatasetColumnField<TVariant>>[] = [
    {
      id: "title",
      header: "Título do conjunto de dados",
      headerLabel: "Título",
      sortField: "title" as DatasetColumnField<TVariant>,
      sortType: "date",
      renderCell: (dataset) => (
        <TextLink href={`/pages/datasets/${dataset.slug}`}>{dataset.title}</TextLink>
      ),
    },
    {
      id: "status",
      header: "Estado",
      renderCell: (dataset) => <ResourceStatusBadge item={dataset} />,
    },
    {
      id: "created_at",
      header: "Criado em",
      sortField: createdSortField,
      sortType: "date",
      renderCell: (dataset) => formatDatasetDate(dataset.created_at),
    },
    {
      id: "last_modified",
      header: "Última modificação",
      sortField: lastModifiedSortField,
      sortType: "date",
      renderCell: (dataset) => (
        <div>
          <div>{formatDatasetDate(dataset.last_modified)}</div>
          {showOwner && dataset.owner && (
            <TextLink href={`/pages/users/${dataset.owner.slug}`} className="text-xs">
              {dataset.owner.first_name} {dataset.owner.last_name}
            </TextLink>
          )}
          {!dataset.owner && showOrganizationFallback && dataset.organization && (
            <TextLink href={`/pages/organizations/${dataset.organization.slug}`} className="text-xs">
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
      header: "Ficheiros",
      headerLabel: "Ficheiros",
      sortField: "resources" as DatasetColumnField<TVariant>,
      sortType: "date",
      renderCell: (dataset) => dataset.resources?.length || 0,
    });
  }

  if (showQualityScore) {
    columns.push({
      id: "quality",
      header: "Pontuação",
      headerLabel: "Pontuação",
      renderCell: (dataset) => {
        const score = calculateQualityScore(QUALITY_CRITERIA, dataset.quality);
        return (
          <>
            <div
              className={
                score <= 45 ? "quality-progress-warning" : score > 50 ? "quality-progress-success" : ""
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
    header: "Ações",
    headerLabel: "Ações",
    renderCell: (dataset) => (
      <TableActionsCell
        viewAction={{ href: `/pages/datasets/${dataset.slug}` }}
        editAction={{ href: editHref(dataset) }}
      />
    ),
  });

  return columns;
}
