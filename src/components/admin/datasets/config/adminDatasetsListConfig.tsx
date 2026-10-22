import { getDatasetLastUpdate } from "@/utils/datasetDates";
import { Pill } from "@ama-pt/agora-design-system";
import { ResourceStatusBadge } from "@/components/admin/ResourceStatusBadge";
import type { AdminListColumn } from "@/components/admin/lists/AdminListTable";
import TextLink from "@/components/Primitives/TextLink";
import type { SortOrder } from "@/hooks/admin-lists/useClientTableState";
import type { Dataset } from "@/service/types/dataset";
import {
  createDateSorter,
  createLocaleStringSorter,
  sortItems,
  getResourceStatusKey,
  type ResourceStatusKey,
} from "@/utils/admin-lists/listHelpers";
import { calculateQualityScore } from "@/utils/calculateQualityScore";
import { QUALITY_CRITERIA } from "@/utils/datasetQuality";
import { formatDatasetDate } from "./datasetsListConfig";

export type AdminDatasetSortField = "title" | "producer" | "last_modified" | "quality";

export const adminDatasetSortFieldMap: Record<AdminDatasetSortField, string | null> = {
  title: "title",
  producer: null,
  last_modified: "last_update",
  quality: null,
};

export function getDatasetProducer(dataset: Dataset): string {
  return (
    dataset.organization?.name ||
    [dataset.owner?.first_name, dataset.owner?.last_name].filter(Boolean).join(" ")
  );
}

function getQualityScore(dataset: Dataset): number {
  return calculateQualityScore(QUALITY_CRITERIA, dataset.quality);
}

export function sortAdminDatasets(
  datasets: Dataset[],
  field: AdminDatasetSortField | null,
  order: SortOrder
): Dataset[] {
  return sortItems(datasets, field, order, {
    title: createLocaleStringSorter((dataset) => dataset.title),
    producer: createLocaleStringSorter(getDatasetProducer),
    last_modified: createDateSorter((dataset) => getDatasetLastUpdate(dataset)),
    quality: (a, b) => getQualityScore(a) - getQualityScore(b),
  });
}

interface AdminDatasetColumnsOptions {
  editHref?: (dataset: Dataset) => string;
  labels: Record<"title" | "status" | "producer" | "lastModified" | "quality", string>;
  statusLabels: Record<ResourceStatusKey, string>;
}

export function createAdminDatasetColumns({
  editHref = (dataset) => `/admin/me/datasets/edit?id=${dataset.id}`,
  labels,
  statusLabels,
}: AdminDatasetColumnsOptions): AdminListColumn<Dataset, AdminDatasetSortField>[] {
  return [
    {
      id: "title",
      header: labels.title,
      sortField: "title",
      sortType: "string",
      renderCell: (dataset) => <TextLink href={editHref(dataset)}>{dataset.title}</TextLink>,
      exportValue: (dataset) => dataset.title,
      exportUrl: (dataset) => `/datasets/${dataset.slug}`,
    },
    {
      id: "status",
      header: labels.status,
      renderCell: (dataset) => <ResourceStatusBadge item={dataset} labels={statusLabels} />,
      exportValue: (dataset) => statusLabels[getResourceStatusKey(dataset)],
    },
    {
      id: "producer",
      header: labels.producer,
      sortField: "producer",
      sortType: "string",
      renderCell: (dataset) => getDatasetProducer(dataset) || "—",
      exportValue: getDatasetProducer,
    },
    {
      id: "last_modified",
      header: labels.lastModified,
      sortField: "last_modified",
      sortType: "date",
      renderCell: (dataset) => formatDatasetDate(getDatasetLastUpdate(dataset)),
      exportValue: (dataset) => formatDatasetDate(getDatasetLastUpdate(dataset)),
    },
    {
      id: "quality",
      header: (
        <span className="inline-block max-w-[160px] whitespace-normal">{labels.quality}</span>
      ),
      headerLabel: labels.quality,
      sortField: "quality",
      sortType: "numeric",
      exportValue: (dataset) => `${getQualityScore(dataset)} %`,
      renderCell: (dataset) => {
        const score = getQualityScore(dataset);
        return (
          <div className="flex justify-center">
            <Pill
              className="h-[24px] rounded-[999px] px-[8px] whitespace-nowrap"
              variant={score > 50 ? "success" : score > 45 ? "warning" : "danger"}
            >
              {score} %
            </Pill>
          </div>
        );
      },
    },
  ];
}
