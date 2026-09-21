import TextLink from "@/components/Primitives/TextLink";
import StatusDot from "@/components/admin/StatusDot";
import type { AdminListColumn } from "@/components/admin/lists/AdminListTable";
import { createTableActionsColumn } from "@/utils/admin-lists/listColumnHelpers";
import {
  createDateSorter,
  createLocaleStringSorter,
  sortItems,
} from "@/utils/admin-lists/listHelpers";
import type { SortOrder } from "@/hooks/admin-lists/useClientTableState";
import { formatDateToDMY } from "@/utils/formatDate";
import type { Post } from "@/service/types/posts";

export type PostSortField = "name" | "type" | "status" | "created_at" | "last_modified";

export const postSortFieldMap: Record<PostSortField, string | null> = {
  name: "name",
  type: null,
  status: "published",
  created_at: "created_at",
  last_modified: "last_modified",
};

export interface PostColumnLabels {
  title: string;
  type: string;
  news: string;
  page: string;
  status: string;
  published: string;
  unpublished: string;
  createdAt: string;
  updatedAt: string;
  action: string;
}

export function filterPosts(
  posts: Post[],
  searchQuery: string,
  typeFilter: string,
  statusFilter: string
) {
  let filtered = posts;

  if (searchQuery.trim()) {
    const query = searchQuery.trim().toLowerCase();
    filtered = filtered.filter((post) => post.name.toLowerCase().includes(query));
  }

  if (typeFilter) {
    filtered = filtered.filter((post) => {
      if (typeFilter === "news") return post.kind !== "page";
      if (typeFilter === "page") return post.kind === "page";
      return true;
    });
  }

  if (statusFilter) {
    filtered = filtered.filter((post) => {
      if (statusFilter === "published") return !!post.published;
      if (statusFilter === "draft") return !post.published;
      return true;
    });
  }

  return filtered;
}

export function sortPosts(posts: Post[], sortField: PostSortField | null, sortOrder: SortOrder) {
  return sortItems(posts, sortField, sortOrder, {
    name: createLocaleStringSorter((post) => post.name),
    // `kind` has exactly two values, so this groups news and pages the same way the
    // type filter above does. Ordering is by the raw value, not the translated label.
    type: (a, b) => Number(a.kind === "page") - Number(b.kind === "page"),
    status: (a, b) => Number(Boolean(a.published)) - Number(Boolean(b.published)),
    created_at: createDateSorter((post) => post.created_at),
    last_modified: createDateSorter((post) => post.last_modified),
  });
}

export function createPostColumns(labels: PostColumnLabels): AdminListColumn<Post, PostSortField>[] {
  return [
    {
      id: "name",
      header: labels.title,
      headerLabel: labels.title,
      sortField: "name",
      sortType: "string",
      renderCell: (post) => <TextLink href={`/noticias/${post.slug}`}>{post.name}</TextLink>,
    },
    {
      id: "type",
      header: labels.type,
      sortField: "type",
      sortType: "string",
      renderCell: (post) => (post.kind === "page" ? labels.page : labels.news),
    },
    {
      id: "status",
      header: labels.status,
      sortField: "status",
      sortType: "string",
      renderCell: (post) => (
        <StatusDot variant={post.published ? "success" : "warning"}>
          {post.published ? labels.published : labels.unpublished}
        </StatusDot>
      ),
    },
    {
      id: "created_at",
      header: labels.createdAt,
      sortField: "created_at",
      sortType: "date",
      renderCell: (post) => formatDateToDMY(post.created_at),
    },
    {
      id: "last_modified",
      header: labels.updatedAt,
      sortField: "last_modified",
      sortType: "date",
      renderCell: (post) => formatDateToDMY(post.last_modified),
    },
    createTableActionsColumn<Post>({
      header: labels.action,
      headerLabel: labels.action,
      viewAction: (post) => ({
        href: `/noticias/${post.slug}`,
      }),
      editAction: (post) => ({
        href: `/admin/posts/${post.id}`,
      }),
    }),
  ];
}
