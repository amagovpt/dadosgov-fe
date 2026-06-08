"use client";

import { useParams } from "next/navigation";
import { TableCell, TableHeaderCell, TableRow } from "@ama-pt/agora-design-system";
import { fetchOrgReuses } from "@/services/api";
import { Reuse } from "@/types/api";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useAuth } from "@/context/AuthContext";
import { filterByStatus } from "@/utils/filterByStatus";
import { formatDateToDMY } from "@/utils/formatDate";
import { AdminResourceListPage, type SortOrder } from "@/components/admin/AdminResourceListPage";
import { ResourceStatusBadge } from "@/components/admin/ResourceStatusBadge";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import TableActionsCell from "@/components/admin/TableActionsCell";
import TextLink from "@/components/Primitives/TextLink";

const collator = new Intl.Collator("pt", { sensitivity: "base" });

function filterOrgReuses(items: Reuse[], query: string, status: string): Reuse[] {
  let result = items;
  if (query) {
    const q = query.toLowerCase();
    result = result.filter((r) => r.title.toLowerCase().includes(q));
  }
  return filterByStatus(result, status);
}

function sortOrgReuses(items: Reuse[], field: string | null, order: SortOrder): Reuse[] {
  if (!field || order === "none") return items;
  const dir = order === "ascending" ? 1 : -1;
  return [...items].sort((a, b) => {
    if (field === "title") return collator.compare(a.title ?? "", b.title ?? "") * dir;
    if (field === "datasets") return ((a.datasets?.length ?? 0) - (b.datasets?.length ?? 0)) * dir;
    return (Date.parse(a.created_at) - Date.parse(b.created_at)) * dir;
  });
}

function renderOrgReuseRow(reuse: Reuse) {
  return (
    <TableRow key={reuse.id}>
      <TableCell headerLabel="Título">
        <TextLink href={`/pages/reuses/${reuse.slug}`}>{reuse.title}</TextLink>
      </TableCell>
      <TableCell headerLabel="Estado">
        <ResourceStatusBadge item={reuse} />
      </TableCell>
      <TableCell headerLabel="Criado em">{formatDateToDMY(reuse.created_at)}</TableCell>
      <TableCell headerLabel="Conjuntos de dados">{reuse.datasets?.length ?? 0}</TableCell>
      <TableCell headerLabel="Ações">
        <TableActionsCell
          viewAction={{ href: `/pages/reuses/${reuse.slug}` }}
          editAction={{ href: `/pages/admin/org/reuses/edit?slug=${reuse.slug}` }}
        />
      </TableCell>
    </TableRow>
  );
}

export default function OrgReusesClient() {
  const params = useParams();
  const routeOrgId = (params?.orgId as string | undefined) ?? undefined;
  const { activeOrg, isLoading: isOrgLoading } = useActiveOrganization();
  const resolvedOrgId = routeOrgId ?? activeOrg?.id;
  const { user } = useAuth();
  const orgName = useViewedOrganizationName(resolvedOrgId, user?.organizations);

  if (!isOrgLoading && !resolvedOrgId) {
    return (
      <AdminEmptyState
        icon="agora-line-user-buildings"
        title="Sem organizações"
        description="Não pertence a nenhuma organização."
      />
    );
  }

  return (
    <AdminResourceListPage<Reuse>
      enabled={!!resolvedOrgId}
      strategy={{
        mode: "client",
        load: async () => {
          const data = await fetchOrgReuses(resolvedOrgId!);
          return data ?? [];
        },
        filter: filterOrgReuses,
        sort: sortOrgReuses,
      }}
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: orgName || "Organização", url: "#" },
        { label: "Reutilizações", url: "#" },
      ]}
      title="Reutilizações"
      searchPlaceholder="Pesquise o nome da reutilização"
      emptyState={{
        icon: "agora-line-edit",
        title: "Sem publicações",
        description: "A organização ainda não publicou uma reutilização.",
        createUrl: "/pages/admin/reuses/new",
      }}
      renderHeaders={(sort) => (
        <>
          <TableHeaderCell
            sortType="numeric"
            sortOrder={sort.getSortOrder("title")}
            onSortChange={sort.onSortChange("title")}
          >
            Título da reutilização
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
            sortType="numeric"
            sortOrder={sort.getSortOrder("datasets")}
            onSortChange={sort.onSortChange("datasets")}
          >
            Conjuntos de dados
          </TableHeaderCell>
          <TableHeaderCell>Ações</TableHeaderCell>
        </>
      )}
      renderRow={renderOrgReuseRow}
    />
  );
}
