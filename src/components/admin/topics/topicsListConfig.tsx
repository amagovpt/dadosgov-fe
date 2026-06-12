import TextLink from "@/components/Primitives/TextLink";
import type { AdminListColumn } from "@/components/admin/lists/AdminListTable";
import { createTableActionsColumn } from "@/utils/admin-lists/listColumnHelpers";
import { formatDateToDMY } from "@/utils/formatDate";
import type { Topic } from "@/service/types/topic";

export function createTopicColumns(): AdminListColumn<Topic>[] {
  return [
    {
      id: "name",
      header: "Nome",
      renderCell: (topic) => <TextLink href={`/pages/themes/${topic.slug}`}>{topic.name}</TextLink>,
    },
    {
      id: "created_at",
      header: "Criado em",
      renderCell: (topic) => formatDateToDMY(topic.created_at),
    },
    {
      id: "datasets",
      header: "Conjuntos de dados",
      renderCell: (topic) => topic.datasets_count ?? 0,
    },
    {
      id: "reuses",
      header: "Reutilizações",
      renderCell: (topic) => topic.reuses_count ?? 0,
    },
    createTableActionsColumn<Topic>({
      viewAction: (topic) => ({
        href: `/pages/themes/${topic.slug}`,
      }),
    }),
  ];
}

