import TextLink from "@/components/Primitives/TextLink";
import type { AdminListColumn } from "@/components/admin/lists/AdminListTable";
import { createTableActionsColumn } from "@/utils/admin-lists/listColumnHelpers";
import { formatDateToDMY } from "@/utils/formatDate";
import type { Topic } from "@/service/types/topic";

export interface TopicColumnLabels {
  name: string;
  createdAt: string;
  datasets: string;
  reuses: string;
}

export function createTopicColumns(labels: TopicColumnLabels): AdminListColumn<Topic>[] {
  return [
    {
      id: "name",
      header: labels.name,
      renderCell: (topic) => <TextLink href={`/themes/${topic.slug}`}>{topic.name}</TextLink>,
    },
    {
      id: "created_at",
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
