import { Icon } from "@ama-pt/agora-design-system";
import type { AdminListColumn } from "@/components/admin/lists/AdminListTable";
import StatusDot from "@/components/admin/StatusDot";
import type { Discussion } from "@/service/types/discussion";
import { formatDateToDMY } from "@/utils/formatDate";

export type DiscussionSortField = "title" | "created" | "closed";

/** TS key -> the key the discussions endpoint accepts in `sort`. */
export const discussionSortFieldMap: Record<DiscussionSortField, string> = {
  title: "title",
  created: "created",
  closed: "closed",
};
export type DiscussionListSortField = "status";

interface OrgDiscussionColumnsOptions {
  onOpenDiscussion: (discussion: Discussion) => void;
  formatDate: (date: string) => string;
  labels: DiscussionColumnLabels;
}

export interface DiscussionColumnLabels {
  title: string;
  author: string;
  status: string;
  date: string;
  messages: string;
  createdAt: string;
  closedAt: string;
  open: string;
  closed: string;
}

export function createDiscussionColumns(
  labels: DiscussionColumnLabels,
): AdminListColumn<Discussion, DiscussionListSortField>[] {
  return [
    {
      id: "title",
      header: labels.title,
      headerLabel: labels.title,
      renderCell: (discussion) => <span className="font-medium">{discussion.title}</span>,
    },
    {
      id: "author",
      header: labels.author,
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
      header: labels.status,
      sortField: "status",
      sortType: "string",
      renderCell: (discussion) =>
        discussion.closed ? (
          <StatusDot variant="success">{labels.closed}</StatusDot>
        ) : (
          <StatusDot variant="informative">{labels.open}</StatusDot>
        ),
    },
    {
      id: "date",
      header: labels.date,
      renderCell: (discussion) => formatDateToDMY(discussion.created),
    },
    {
      id: "messages",
      header: labels.messages,
      renderCell: (discussion) => discussion.discussion?.length || 0,
    },
  ];
}

export function createOrgDiscussionColumns({
  onOpenDiscussion,
  formatDate,
  labels,
}: OrgDiscussionColumnsOptions): AdminListColumn<Discussion, DiscussionSortField>[] {
  return [
    {
      id: "title",
      header: labels.title,
      headerLabel: labels.title,
      sortField: "title",
      sortType: "string",
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
      header: labels.createdAt,
      sortField: "created",
      sortType: "date",
      renderCell: (discussion) => formatDate(discussion.created),
    },
    {
      id: "closed",
      header: labels.closedAt,
      sortField: "closed",
      sortType: "date",
      renderCell: (discussion) => (discussion.closed ? formatDate(discussion.closed) : "-"),
    },
  ];
}
