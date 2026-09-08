import TextLink from "@/components/Primitives/TextLink";
import type { AdminListColumn } from "@/components/admin/lists/AdminListTable";
import { createTableActionsColumn } from "@/utils/admin-lists/listColumnHelpers";
import { formatDateToDMY } from "@/utils/formatDate";
import type { Topic } from "@/service/types/topic";

export type TopicSortField = "name" | "created_at";

/**
 * TS key -> the key `TopicApiParser.sorts` accepts. The dataset and reuse counts are
 * deliberately absent: the API neither sorts by them nor serialises them, so those two
 * columns render 0 for every topic and an arrow there would order nothing.
 */
export const topicSortFieldMap: Record<TopicSortField, string> = {
  name: "name",
  created_at: "created",
};

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
      sortField: "name",
      sortType: "string",
      header: labels.name,
      renderCell: (topic) => <TextLink href={`/themes/${topic.slug}`}>{topic.name}</TextLink>,
    },
    {
      id: "created_at",
      sortField: "created_at",
      sortType: "date",
      header: labels.createdAt,
      renderCell: (topic) => formatDateToDMY(topic.created_at),
    },
    {
      id: "datasets",
      header: labels.datasets,
      renderCell: (topic) => topic.datasets_count ?? 0,
    },
    {
      id: "reuses",
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
