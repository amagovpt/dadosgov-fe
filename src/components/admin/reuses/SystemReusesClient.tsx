"use client";

import { TableCell, TableHeaderCell, TableRow } from "@ama-pt/agora-design-system";
import { fetchReuses } from "@/service/api/reuses";
import { Reuse } from "@/service/types/reuse";
import { formatDateToDMY } from "@/utils/formatDate";
import {
  AdminResourceListPage,
  type ServerLoadParams,
} from "@/components/admin/AdminResourceListPage";
import { ResourceStatusBadge } from "@/components/admin/ResourceStatusBadge";
import TableActionsCell from "@/components/admin/TableActionsCell";
import TextLink from "@/components/Primitives/TextLink";

const SORT_FIELD_MAP: Record<string, string> = {
  title: "title",
  created_at: "created",
};

function buildStatusFilters(status: string) {
  if (status === "public") return { private: false, archived: false, deleted: false };
  if (status === "draft") return { private: true, archived: false, deleted: false };
  if (status === "archived") return { archived: true, deleted: false };
  if (status === "deleted") return { deleted: true };
  return {};
}

async function loadSystemReuses({ page, pageSize, query, status, sortField, sortOrder }: ServerLoadParams) {
  const apiField = sortField ? SORT_FIELD_MAP[sortField] : null;
  const sort =
    sortOrder === "none" || !apiField
      ? undefined
      : `${sortOrder === "descending" ? "-" : ""}${apiField}`;

  const response = await fetchReuses(page, pageSize, {
    q: query || undefined,
    sort,
    ...buildStatusFilters(status),
  });
  return { data: response.data ?? [], total: response.total ?? 0 };
}

function renderSystemReuseRow(reuse: Reuse) {
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
          editAction={{ href: `/pages/admin/reuses/${reuse.id}` }}
        />
      </TableCell>
    </TableRow>
  );
}

export default function SystemReusesClient() {
  return (
    <AdminResourceListPage<Reuse>
      strategy={{ mode: "server", load: loadSystemReuses }}
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: "Sistema", url: "#" },
        { label: "Reutilizações", url: "/pages/admin/system/reuses" },
      ]}
      title="Reutilizações"
      searchPlaceholder="Pesquise o nome da reutilização"
      emptyState={{
        icon: "agora-line-edit",
        title: "Sem reutilizações",
        description: "Nenhuma reutilização encontrada.",
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
          <TableHeaderCell>Conjuntos de dados</TableHeaderCell>
          <TableHeaderCell>Ações</TableHeaderCell>
        </>
      )}
      renderRow={renderSystemReuseRow}
    />
  );
}
