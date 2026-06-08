"use client";

import { useParams } from "next/navigation";
import { TableCell, TableHeaderCell, TableRow } from "@ama-pt/agora-design-system";
import { fetchOrgCommunityResources } from "@/services/api";
import { CommunityResource } from "@/types/api";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useAuth } from "@/context/AuthContext";
import { formatDateToDMY } from "@/utils/formatDate";
import { AdminResourceListPage, type SortOrder } from "@/components/admin/AdminResourceListPage";
import { ResourceStatusBadge } from "@/components/admin/ResourceStatusBadge";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import TableActionsCell from "@/components/admin/TableActionsCell";
import TextLink from "@/components/Primitives/TextLink";

function filterOrgCommunityResources(items: CommunityResource[], query: string): CommunityResource[] {
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter((r) => r.title.toLowerCase().includes(q));
}

function sortOrgCommunityResources(
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
      case "created_at":
        return (Date.parse(a.created_at) - Date.parse(b.created_at)) * dir;
      default:
        return (Date.parse(a.last_modified) - Date.parse(b.last_modified)) * dir;
    }
  });
}

function renderOrgCommunityResourceRow(resource: CommunityResource) {
  return (
    <TableRow key={resource.id}>
      <TableCell headerLabel="Título">
        <span className="text-primary-600">{resource.title}</span>
      </TableCell>
      <TableCell headerLabel="Estado">
        <ResourceStatusBadge item={resource} />
      </TableCell>
      <TableCell headerLabel="Criado em">{formatDateToDMY(resource.created_at)}</TableCell>
      <TableCell headerLabel="Última modificação">
        <div>{formatDateToDMY(resource.last_modified)}</div>
        {resource.owner && (
          <TextLink href={`/pages/users/${resource.owner.slug}`} className="text-xs">
            {resource.owner.first_name} {resource.owner.last_name}
          </TextLink>
        )}
      </TableCell>
      <TableCell headerLabel="Ações">
        <TableActionsCell
          editAction={{
            href: `/pages/admin/community-resources/edit?resource_id=${resource.id}`,
          }}
        />
      </TableCell>
    </TableRow>
  );
}

export default function OrgCommunityResourcesClient() {
  const params = useParams();
  const routeOrgId = params?.orgId as string | undefined;
  const { activeOrg, isLoading: isOrgLoading } = useActiveOrganization();
  const resolvedOrgId = routeOrgId || activeOrg?.id;
  const { user } = useAuth();
  const orgName = useViewedOrganizationName(resolvedOrgId, user?.organizations);

  if (!isOrgLoading && !resolvedOrgId) {
    return (
      <AdminEmptyState
        icon="agora-line-buildings"
        title="Sem organizações"
        description="Não pertence a nenhuma organização."
      />
    );
  }

  return (
    <AdminResourceListPage<CommunityResource>
      enabled={!!resolvedOrgId}
      strategy={{
        mode: "client",
        load: async () => {
          const res = await fetchOrgCommunityResources(resolvedOrgId!, 1, 9999);
          return res.data ?? [];
        },
        filter: (items, query) => filterOrgCommunityResources(items, query),
        sort: sortOrgCommunityResources,
      }}
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: orgName || "Organização", url: "#" },
        { label: "Recursos comunitários" },
      ]}
      title="Recursos comunitários"
      searchPlaceholder="Pesquisar recursos comunitários"
      showStatusFilter={false}
      emptyState={{
        icon: "agora-line-buildings",
        title: "Sem recursos comunitários",
        description: "A organização ainda não tem recursos comunitários.",
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
            Última modificação
          </TableHeaderCell>
          <TableHeaderCell>Ações</TableHeaderCell>
        </>
      )}
      renderRow={renderOrgCommunityResourceRow}
    />
  );
}
