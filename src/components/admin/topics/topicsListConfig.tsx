import TextLink from "@/components/Primitives/TextLink";
import type { AdminListColumn } from "@/components/admin/lists/AdminListTable";
import type { SortOrder } from "@/hooks/admin-lists/useClientTableState";
import { createTableActionsColumn } from "@/utils/admin-lists/listColumnHelpers";
import {
  createDateSorter,
  createLocaleStringSorter,
  sortItems,
} from "@/utils/admin-lists/listHelpers";
import { formatDateToDMY } from "@/utils/formatDate";
import type { Topic } from "@/service/types/topic";

/**
 * The topics endpoint paginates and can only sort by name and creation date, not by the
 * dataset and reuse counts the table shows, so the view loads the whole (small) catalogue
 * once and sorts every column client-side. Keep this in sync with the API page_size ceiling
 * if the catalogue ever outgrows a single request.
 */
export const TOPICS_FETCH_PAGE_SIZE = 9999;

export type TopicSortField = "name" | "created_at" | "datasets" | "reuses";

export function sortTopics(
  topics: Topic[],
  sortField: TopicSortField | null,
  sortOrder: SortOrder
) {
  return sortItems(topics, sortField, sortOrder, {
    name: createLocaleStringSorter((topic) => topic.name),
    created_at: createDateSorter((topic) => topic.created_at),
    datasets: (a, b) => (a.datasets_count ?? 0) - (b.datasets_count ?? 0),
    reuses: (a, b) => (a.reuses_count ?? 0) - (b.reuses_count ?? 0),
  });
}

export interface TopicColumnLabels {
  name: string;
  createdAt: string;
  datasets: string;
  reuses: string;
}

export function createTopicColumns(
  labels: TopicColumnLabels
): AdminListColumn<Topic, TopicSortField>[] {
  return [
    {
      id: "name",
      sortField: "name" as TopicSortField,
      sortType: "string",
      header: labels.name,
      renderCell: (topic) => <TextLink href={`/themes/${topic.slug}`}>{topic.name}</TextLink>,
    },
    {
      id: "created_at",
      sortField: "created_at" as TopicSortField,
      sortType: "date",
      header: labels.createdAt,
      renderCell: (topic) => formatDateToDMY(topic.created_at),
    },
    {
      id: "datasets",
      sortField: "datasets" as TopicSortField,
      sortType: "numeric",
      header: labels.datasets,
      renderCell: (topic) => topic.datasets_count ?? 0,
    },
    {
      id: "reuses",
      sortField: "reuses" as TopicSortField,
      sortType: "numeric",
      header: labels.reuses,
      renderCell: (topic) => topic.reuses_count ?? 0,
    },
    createTableActionsColumn<Topic>({
      viewAction: (topic) => ({
        href: `/themes/${topic.slug}`,
      }),
    }),
  ];
}
