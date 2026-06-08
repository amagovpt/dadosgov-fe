"use client";

import { useSearchParams } from "next/navigation";
import { TableCell, TableHeaderCell, TableRow } from "@ama-pt/agora-design-system";
import { fetchAllCommunityResources } from "@/services/api";
import { CommunityResource } from "@/types/api";
import { formatDateToDMY } from "@/utils/formatDate";
import { AdminResourceListPage, type SortOrder } from "@/components/admin/AdminResourceListPage";
import StatusDot from "@/components/admin/StatusDot";
import TableActionsCell from "@/components/admin/TableActionsCell";
import TextLink from "@/components/Primitives/TextLink";
import CommunityResourceEditClient from "./CommunityResourceEditClient";

function filterSystemCommunityResources(
  items: CommunityResource[],
  query: string,
): CommunityResource[] {
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter(
    (r) =>
      r.title.toLowerCase().includes(q) || (r.format && r.format.toLowerCase().includes(q)),
  );
}

function sortSystemCommunityResources(
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

function renderSystemCommunityResourceRow(resource: CommunityResource) {
  const authorName = resource.organization
    ? resource.organization.name
    : resource.owner
      ? `${resource.owner.first_name} ${resource.owner.last_name}`.trim()
      : "—";
  void authorName;

  return (
    <TableRow key={resource.id}>
      <TableCell headerLabel="Título do recurso">
        <div>
          <span className="text-neutral-900">{resource.title}</span>
          {resource.dataset && (
            <div className="text-sm text-neutral-700">
              <TextLink href={`/pages/datasets/${resource.dataset.id}`}>
                {resource.dataset.title}
              </TextLink>
            </div>
          )}
        </div>
      </TableCell>
      <TableCell headerLabel="Estado">
        <StatusDot
          variant={resource.deleted ? "danger" : resource.archived ? "warning" : "success"}
        >
          {resource.deleted ? "Eliminado" : resource.archived ? "Arquivado" : "Publicado"}
        </StatusDot>
      </TableCell>
      <TableCell headerLabel="Formato">
        {resource.format ? resource.format.toUpperCase() : "—"}
      </TableCell>
      <TableCell headerLabel="Criado em">{formatDateToDMY(resource.created_at)}</TableCell>
      <TableCell headerLabel="Modificado em">{formatDateToDMY(resource.last_modified)}</TableCell>
      <TableCell headerLabel="Ação">
        <TableActionsCell
          editAction={{
            href: `/pages/admin/system/community-resources?resource_id=${resource.id}`,
          }}
        />
      </TableCell>
    </TableRow>
  );
}

export default function SystemCommunityResourcesClient() {
  const searchParams = useSearchParams();
  const resourceId = searchParams.get("resource_id");

  if (resourceId) {
    return <CommunityResourceEditClient />;
  }

  return (
    <AdminResourceListPage<CommunityResource>
      strategy={{
        mode: "client",
        load: async () => {
          const res = await fetchAllCommunityResources(1, 9999);
          return res.data ?? [];
        },
        filter: (items, query) => filterSystemCommunityResources(items, query),
        sort: sortSystemCommunityResources,
      }}
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: "Sistema", url: "#" },
        { label: "Recursos comunitários", url: "/pages/admin/system/community-resources" },
      ]}
      title="Recursos comunitários"
      searchPlaceholder="Pesquisar recursos comunitários"
      showStatusFilter={false}
      emptyState={{
        icon: "agora-line-user-group",
        title: "Sem recursos comunitários",
        description: "Nenhum recurso comunitário encontrado.",
      }}
      renderHeaders={(sort) => (
        <>
          <TableHeaderCell
            sortType="date"
            sortOrder={sort.getSortOrder("title")}
            onSortChange={sort.onSortChange("title")}
          >
            Título do recurso
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
      renderRow={renderSystemCommunityResourceRow}
    />
  );
}
