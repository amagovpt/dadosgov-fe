"use client";

import { useSearchParams } from "next/navigation";
import { TableCell, TableHeaderCell, TableRow } from "@ama-pt/agora-design-system";
import { fetchMyReuses } from "@/services/api";
import { Reuse } from "@/types/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { filterByStatus } from "@/utils/filterByStatus";
import { formatDateToDMY } from "@/utils/formatDate";
import { AdminResourceListPage, type SortOrder } from "@/components/admin/AdminResourceListPage";
import { ResourceStatusBadge } from "@/components/admin/ResourceStatusBadge";
import TableActionsCell from "@/components/admin/TableActionsCell";
import TextLink from "@/components/Primitives/TextLink";

const collator = new Intl.Collator("pt", { sensitivity: "base" });

function filterReuses(items: Reuse[], query: string, status: string): Reuse[] {
  let result = items;
  if (query) {
    const q = query.toLowerCase();
    result = result.filter((r) => r.title.toLowerCase().includes(q));
  }
  return status ? filterByStatus(result, status) : result.filter((r) => !r.deleted);
}

function sortReuses(items: Reuse[], field: string | null, order: SortOrder): Reuse[] {
  if (!field || order === "none") return items;
  const dir = order === "ascending" ? 1 : -1;
  return [...items].sort((a, b) => {
    if (field === "title") return collator.compare(a.title ?? "", b.title ?? "") * dir;
    if (field === "datasets") return ((a.datasets?.length ?? 0) - (b.datasets?.length ?? 0)) * dir;
    return (Date.parse(a.created_at) - Date.parse(b.created_at)) * dir;
  });
}

function renderReuseRow(reuse: Reuse) {
  return (
    <TableRow key={reuse.id}>
      <TableCell headerLabel="Título">
        <TextLink href={`/pages/reuses/${reuse.slug}`}>{reuse.title}</TextLink>
      </TableCell>
      <TableCell headerLabel="Estado">
        <ResourceStatusBadge item={reuse} />
      </TableCell>
      <TableCell headerLabel="Criado em">
        {formatDateToDMY(reuse.created_at)}
        <br />
        <span className="text-sm text-neutral-500">
          {reuse.owner ? (
            <TextLink href={`/pages/users/${reuse.owner.slug}`} className="text-xs">
              {reuse.owner.first_name} {reuse.owner.last_name}
            </TextLink>
          ) : (
            "—"
          )}
        </span>
      </TableCell>
      <TableCell headerLabel="Conjuntos de dados">{reuse.datasets?.length ?? 0}</TableCell>
      <TableCell headerLabel="Ações">
        <TableActionsCell
          viewAction={{ href: `/pages/reuses/${reuse.slug}` }}
          editAction={{ href: `/pages/admin/me/reuses/edit?id=${reuse.id}` }}
        />
      </TableCell>
    </TableRow>
  );
}

export default function ReusesClient() {
  const { displayName } = useCurrentUser();
  const searchParams = useSearchParams();

  return (
    <AdminResourceListPage<Reuse>
      strategy={{
        mode: "client",
        load: async () => {
          const res = await fetchMyReuses(1, 9999);
          return res.data ?? [];
        },
        filter: filterReuses,
        sort: sortReuses,
      }}
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: displayName || "...", url: "#" },
        { label: "Reutilizações", url: "/pages/admin/me/reuses" },
      ]}
      title="Reutilizações"
      searchPlaceholder="Pesquise o nome da reutilização"
      initialStatus={searchParams.get("status") ?? ""}
      emptyState={{
        icon: "bar_chart",
        title: "Sem reutilizações",
        description: "Não publicou reutilizações.",
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
      renderRow={renderReuseRow}
    />
  );
}
