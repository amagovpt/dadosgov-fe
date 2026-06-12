"use client";

import { useSearchParams } from "next/navigation";
import { TableCell, TableHeaderCell, TableRow } from "@ama-pt/agora-design-system";
import { fetchMyDataservices } from "@/service/api/dataservices";
import { Dataservice } from "@/service/types/dataservice";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { filterByStatus } from "@/utils/filterByStatus";
import { formatDateToDMY } from "@/utils/formatDate";
import { AdminResourceListPage, type SortOrder } from "@/components/admin/AdminResourceListPage";
import { ResourceStatusBadge } from "@/components/admin/ResourceStatusBadge";
import TableActionsCell from "@/components/admin/TableActionsCell";
import TextLink from "@/components/Primitives/TextLink";

const collator = new Intl.Collator("pt", { sensitivity: "base" });

function filterDataservices(items: Dataservice[], query: string, status: string): Dataservice[] {
  let result = filterByStatus(items, status);
  if (query) {
    const q = query.toLowerCase();
    result = result.filter((a) => a.title?.toLowerCase().includes(q) ?? false);
  }
  return result;
}

function sortDataservices(items: Dataservice[], field: string | null, order: SortOrder): Dataservice[] {
  if (!field || order === "none") return items;
  const dir = order === "ascending" ? 1 : -1;
  return [...items].sort((a, b) => {
    if (field === "title") return collator.compare(a.title ?? "", b.title ?? "") * dir;
    const av = field === "created_at" ? a.created_at : a.last_modified;
    const bv = field === "created_at" ? b.created_at : b.last_modified;
    return (Date.parse(av) - Date.parse(bv)) * dir;
  });
}

function renderDataserviceRow(api: Dataservice) {
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

export default function DataservicesClient() {
  const { displayName } = useCurrentUser();
  const searchParams = useSearchParams();

  return (
    <AdminResourceListPage<Dataservice>
      strategy={{
        mode: "client",
        load: async () => {
          const res = await fetchMyDataservices(1, 9999);
          return res.data ?? [];
        },
        filter: filterDataservices,
        sort: sortDataservices,
      }}
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: displayName || "...", url: "#" },
        { label: "API", url: "/pages/admin/dataservices" },
      ]}
      title="API"
      searchPlaceholder="Pesquise o nome da API"
      initialStatus={searchParams.get("status") ?? ""}
      emptyState={{
        icon: "agora-line-edit",
        title: "Sem APIs",
        description: "Não publicou nenhuma API.",
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
      renderRow={renderDataserviceRow}
    />
  );
}
