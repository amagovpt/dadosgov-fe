"use client";

import { TableCell, TableHeaderCell, TableRow } from "@ama-pt/agora-design-system";
import { fetchDataservices } from "@/services/api";
import { Dataservice } from "@/types/api";
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
  last_modified: "last_modified",
};

function buildStatusFilters(status: string) {
  if (status === "public") return { private: false, archived: false, deleted: false };
  if (status === "draft") return { private: true, archived: false, deleted: false };
  if (status === "archived") return { archived: true, deleted: false };
  if (status === "deleted") return { deleted: true };
  return {};
}

async function loadSystemDataservices({
  page,
  pageSize,
  query,
  status,
  sortField,
  sortOrder,
}: ServerLoadParams) {
  const apiField = sortField ? SORT_FIELD_MAP[sortField] : null;
  const sort =
    sortOrder === "none" || !apiField
      ? undefined
      : `${sortOrder === "descending" ? "-" : ""}${apiField}`;

  const response = await fetchDataservices(page, pageSize, {
    q: query || undefined,
    sort,
    ...buildStatusFilters(status),
  });
  return { data: response.data ?? [], total: response.total ?? 0 };
}

function renderSystemDataserviceRow(api: Dataservice) {
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
        {api.owner && (
          <>
            <br />
            <span className="text-sm text-neutral-500">
              por {api.owner.first_name} {api.owner.last_name}
            </span>
          </>
        )}
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

export default function SystemDataservicesClient() {
  return (
    <AdminResourceListPage<Dataservice>
      strategy={{ mode: "server", load: loadSystemDataservices }}
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: "Sistema", url: "#" },
        { label: "API", url: "/pages/admin/system/dataservices" },
      ]}
      title="API"
      searchPlaceholder="Pesquise o nome da API"
      emptyState={{
        icon: "agora-line-code",
        title: "Sem APIs",
        description: "Nenhuma API encontrada.",
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
      renderRow={renderSystemDataserviceRow}
    />
  );
}
