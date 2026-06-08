"use client";

import { useParams } from "next/navigation";
import { TableCell, TableHeaderCell, TableRow } from "@ama-pt/agora-design-system";
import { fetchOrgDataservices } from "@/services/api";
import { Dataservice } from "@/types/api";
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

function filterOrgDataservices(items: Dataservice[], query: string, status: string): Dataservice[] {
  let result = filterByStatus(items, status);
  if (query) {
    const q = query.toLowerCase();
    result = result.filter((a) => a.title?.toLowerCase().includes(q) ?? false);
  }
  return result;
}

function sortOrgDataservices(items: Dataservice[], field: string | null, order: SortOrder): Dataservice[] {
  if (!field || order === "none") return items;
  const dir = order === "ascending" ? 1 : -1;
  return [...items].sort((a, b) => {
    if (field === "title") return collator.compare(a.title ?? "", b.title ?? "") * dir;
    const av = field === "created_at" ? a.created_at : a.last_modified;
    const bv = field === "created_at" ? b.created_at : b.last_modified;
    return (Date.parse(av) - Date.parse(bv)) * dir;
  });
}

function renderOrgDataserviceRow(api: Dataservice) {
  return (
    <TableRow key={api.id}>
      <TableCell headerLabel="Título">
        <TextLink href={`/pages/dataservices/${api.slug}`}>{api.title}</TextLink>
      </TableCell>
      <TableCell headerLabel="Estado">
        <ResourceStatusBadge item={api} />
      </TableCell>
      <TableCell headerLabel="Criado em">{formatDateToDMY(api.created_at)}</TableCell>
      <TableCell headerLabel="Modificado em">
        {formatDateToDMY(api.last_modified)}
        <br />
        <span className="text-sm text-neutral-500">
          sobre <span className="text-success-600">●</span>{" "}
          {api.owner ? `${api.owner.first_name} ${api.owner.last_name}` : "—"}
        </span>
      </TableCell>
      <TableCell headerLabel="Ações">
        <TableActionsCell
          viewAction={{ href: `/pages/dataservices/${api.slug}` }}
          editAction={{ href: `/pages/admin/dataservices/edit?slug=${api.slug}` }}
        />
      </TableCell>
    </TableRow>
  );
}

export default function OrgDataservicesClient() {
  const params = useParams();
  const routeOrgId = params?.orgId as string | undefined;
  const { activeOrg, isLoading: isOrgLoading } = useActiveOrganization();
  const resolvedOrgId = routeOrgId || activeOrg?.id;
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
    <AdminResourceListPage<Dataservice>
      enabled={!!resolvedOrgId}
      strategy={{
        mode: "client",
        load: async () => {
          const res = await fetchOrgDataservices(resolvedOrgId!, 1, 9999);
          return res.data ?? [];
        },
        filter: filterOrgDataservices,
        sort: sortOrgDataservices,
      }}
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: orgName || "Organização", url: "#" },
        { label: "API" },
      ]}
      title="API"
      searchPlaceholder="Pesquise o nome da API"
      emptyState={{
        icon: "agora-line-edit",
        title: "Sem publicações",
        description: "A organização ainda não publicou uma API.",
        createUrl: "/pages/admin/dataservices/new",
      }}
      renderHeaders={(sort) => (
        <>
          <TableHeaderCell
            sortType="numeric"
            sortOrder={sort.getSortOrder("title")}
            onSortChange={sort.onSortChange("title")}
          >
            Título da API
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
            Modificado em
          </TableHeaderCell>
          <TableHeaderCell>Ações</TableHeaderCell>
        </>
      )}
      renderRow={renderOrgDataserviceRow}
    />
  );
}
