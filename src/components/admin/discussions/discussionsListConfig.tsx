import { Icon } from "@ama-pt/agora-design-system";
import type { AdminListColumn } from "@/components/admin/lists/AdminListTable";
import StatusDot from "@/components/admin/StatusDot";
import type { Discussion } from "@/service/types/discussion";
import { formatDateToDMY } from "@/utils/formatDate";

export type DiscussionSortField = "created" | "closed";

interface OrgDiscussionColumnsOptions {
  onOpenDiscussion: (discussion: Discussion) => void;
  formatDate: (date: string) => string;
}

export function createDiscussionColumns(): AdminListColumn<Discussion>[] {
  return [
    {
      id: "title",
      header: "Título",
      headerLabel: "Título",
      renderCell: (discussion) => <span className="font-medium">{discussion.title}</span>,
    },
    {
      id: "author",
      header: "Autor",
      renderCell: (discussion) => (
        <div className="flex items-center gap-8">
          {discussion.user?.avatar_thumbnail ? (
            <img
              src={discussion.user.avatar_thumbnail}
              alt={`${discussion.user.first_name} ${discussion.user.last_name}`}
              className="h-24 w-24 rounded-full"
            />
          ) : (
            <Icon name="agora-line-user" className="h-24 w-24" />
          )}
          <span>
            {discussion.user?.first_name} {discussion.user?.last_name}
          </span>
        </div>
      ),
    },
    {
      id: "status",
      header: "Estado",
      renderCell: (discussion) =>
        discussion.closed ? (
          <StatusDot variant="success">FECHADA</StatusDot>
        ) : (
          <StatusDot variant="informative">ABERTA</StatusDot>
        ),
    },
    {
      id: "date",
      header: "Data",
      renderCell: (discussion) => formatDateToDMY(discussion.created),
    },
    {
      id: "messages",
      header: "Mensagens",
      renderCell: (discussion) => discussion.discussion?.length || 0,
    },
  ];
}

export function createOrgDiscussionColumns({
  onOpenDiscussion,
  formatDate,
}: OrgDiscussionColumnsOptions): AdminListColumn<Discussion, DiscussionSortField>[] {
  return [
    {
      id: "title",
      header: "Título",
      headerLabel: "Título",
      renderCell: (discussion) => (
        <button
          className="text-left text-primary-600 underline"
          onClick={(event) => {
            event.stopPropagation();
            onOpenDiscussion(discussion);
          }}
        >
          {discussion.title}
        </button>
      ),
    },
    {
      id: "created",
      header: "Criado em",
      sortField: "created",
      sortType: "date",
      renderCell: (discussion) => formatDate(discussion.created),
    },
    {
      id: "closed",
      header: "Fechado em",
      sortField: "closed",
      sortType: "date",
      renderCell: (discussion) => (discussion.closed ? formatDate(discussion.closed) : "-"),
    },
  ];
}
