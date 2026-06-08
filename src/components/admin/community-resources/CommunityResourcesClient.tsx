"use client";

import { TableCell, TableHeaderCell, TableRow } from "@ama-pt/agora-design-system";
import { fetchMyCommunityResources } from "@/services/api";
import { CommunityResource } from "@/types/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatDateToDMY } from "@/utils/formatDate";
import { AdminResourceListPage, type SortOrder } from "@/components/admin/AdminResourceListPage";
import { ResourceStatusBadge } from "@/components/admin/ResourceStatusBadge";
import TableActionsCell from "@/components/admin/TableActionsCell";
import TextLink from "@/components/Primitives/TextLink";

function filterCommunityResources(items: CommunityResource[], query: string): CommunityResource[] {
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter(
    (r) =>
      r.title.toLowerCase().includes(q) || (r.format && r.format.toLowerCase().includes(q)),
  );
}

function sortCommunityResources(
  items: CommunityResource[],
  field: string | null,
  order: SortOrder,
): CommunityResource[] {
  if (!field || order === "none") return items;
  const dir = order === "ascending" ? 1 : -1;
  return [...items].sort((a, b) => {
    switch (field) {
      case "title":
        return (a.title ?? "").localeCompare(b.title ?? "") * dir;
      case "format":
        return (a.format ?? "").localeCompare(b.format ?? "") * dir;
      case "created_at":
        return (Date.parse(a.created_at) - Date.parse(b.created_at)) * dir;
      default:
        return (Date.parse(a.last_modified) - Date.parse(b.last_modified)) * dir;
    }
  });
}

function renderCommunityResourceRow(resource: CommunityResource) {
  return (
    <TableRow key={resource.id}>
      <TableCell headerLabel="Título">
        <span className="text-neutral-900">{resource.title}</span>
        {resource.dataset && (
          <>
            <br />
            <TextLink href={`/pages/datasets/${resource.dataset.id}`} className="text-sm">
              {resource.dataset.title}
            </TextLink>
          </>
        )}
      </TableCell>
      <TableCell headerLabel="Estado">
        <ResourceStatusBadge item={resource} />
      </TableCell>
      <TableCell headerLabel="Formato">{resource.format || "—"}</TableCell>
      <TableCell headerLabel="Criado em">{formatDateToDMY(resource.created_at)}</TableCell>
      <TableCell headerLabel="Modificado em">{formatDateToDMY(resource.last_modified)}</TableCell>
      <TableCell headerLabel="Ação">
        <TableActionsCell
          editAction={{ href: `/pages/admin/me/community-resources/edit?id=${resource.id}` }}
        />
      </TableCell>
    </TableRow>
  );
}

export default function CommunityResourcesClient() {
  const { displayName } = useCurrentUser();

  return (
    <AdminResourceListPage<CommunityResource>
      strategy={{
        mode: "client",
        load: async () => {
          const res = await fetchMyCommunityResources(1, 9999);
          return res.data ?? [];
        },
        filter: (items, query) => filterCommunityResources(items, query),
        sort: sortCommunityResources,
      }}
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: displayName || "...", url: "#" },
        { label: "Recursos comunitários", url: "/pages/admin/me/community-resources" },
      ]}
      title="Recursos comunitários"
      searchPlaceholder="Pesquisar recursos comunitários"
      showStatusFilter={false}
      emptyState={{
        icon: "agora-line-user-group",
        title: "Sem recursos comunitários",
        description: "Ainda não publicou um recurso comunitário.",
        createUrl: "/pages/admin/community-resources/new",
      }}
      renderHeaders={(sort) => (
        <>
          <TableHeaderCell
            sortType="date"
            sortOrder={sort.getSortOrder("title")}
            onSortChange={sort.onSortChange("title")}
          >
            Título
          </TableHeaderCell>
          <TableHeaderCell>Estado</TableHeaderCell>
          <TableHeaderCell
            sortType="date"
            sortOrder={sort.getSortOrder("format")}
            onSortChange={sort.onSortChange("format")}
          >
            Formato
          </TableHeaderCell>
          <TableHeaderCell
            sortType="date"
            sortOrder={sort.getSortOrder("created_at")}
            onSortChange={sort.onSortChange("created_at")}
          >
            Criado em
          </TableHeaderCell>
          <TableHeaderCell
            sortType="date"
            sortOrder={sort.getSortOrder("last_modified")}
            onSortChange={sort.onSortChange("last_modified")}
          >
            Modificado em
          </TableHeaderCell>
          <TableHeaderCell>Ação</TableHeaderCell>
        </>
      )}
      renderRow={renderCommunityResourceRow}
    />
  );
}
