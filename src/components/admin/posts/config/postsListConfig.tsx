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

export type PostSortField = "name" | "created_at" | "last_modified";

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
    created_at: createDateSorter((post) => post.created_at),
    last_modified: createDateSorter((post) => post.last_modified),
  });
}

export function createPostColumns(): AdminListColumn<Post, PostSortField>[] {
  return [
    {
      id: "name",
      header: "Título",
      headerLabel: "Título",
      sortField: "name",
      sortType: "string",
      renderCell: (post) => <TextLink href={`/posts/${post.slug}`}>{post.name}</TextLink>,
    },
    {
      id: "type",
      header: "Tipo",
      renderCell: (post) => (post.kind === "page" ? "Página" : "Notícias"),
    },
    {
      id: "status",
      header: "Estado",
      renderCell: (post) => (
        <StatusDot variant={post.published ? "success" : "warning"}>
          {post.published ? "Publicado" : "Despublicado"}
        </StatusDot>
      ),
    },
    {
      id: "created_at",
      header: "Criado em",
      sortField: "created_at",
      sortType: "date",
      renderCell: (post) => formatDateToDMY(post.created_at),
    },
    {
      id: "last_modified",
      header: "Atualizado em",
      sortField: "last_modified",
      sortType: "date",
      renderCell: (post) => formatDateToDMY(post.last_modified),
    },
    createTableActionsColumn<Post>({
      header: "Ação",
      headerLabel: "Ação",
      viewAction: (post) => ({
        href: `/posts/${post.slug}`,
      }),
      editAction: (post) => ({
        href: `/admin/posts/${post.id}`,
      }),
    }),
  ];
}

