"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@ama-pt/agora-design-system";
import { ResourceStatusBadge } from "@/components/admin/ResourceStatusBadge";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import { fetchMyReuses } from "@/services/api";
import { Reuse } from "@/types/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatDateToDMY } from "@/utils/formatDate";
import TextLink from "@/components/Primitives/TextLink";
import { filterByStatus } from "@/utils/filterByStatus";
import { SortOrder, useSortControls } from "@/components/admin/lists/useClientTableState";
import { useDebouncedSearch } from "@/components/admin/lists/useDebouncedSearch";
import AdminEmptyState from "../AdminEmptyState";
import StatusFilterSelect from "../StatusFilterSelect";
import TableActionsCell from "../TableActionsCell";

type ReuseSortField = "title" | "created_at" | "datasets";

export default function ReusesClient() {
  const { displayName } = useCurrentUser();
  const searchParams = useSearchParams();

  const [reuses, setReuses] = useState<Reuse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get("status") ?? "");
  const [sortField, setSortField] = useState<ReuseSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");

  const { handleSort, getSortOrder } = useSortControls(
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    setCurrentPage
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchMyReuses(1, 9999);
      setReuses(response.data || []);
    } catch (error) {
      console.error("Error loading reuses:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadData();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadData]);

  const handleSearch = useDebouncedSearch((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  });

  const filteredReuses = useMemo(() => {
    let result = reuses;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((r) => r.title.toLowerCase().includes(q));
    }
    if (statusFilter) {
      result = filterByStatus(result, statusFilter);
    } else {
      result = result.filter((r) => !r.deleted);
    }

    return result;
  }, [reuses, searchQuery, statusFilter]);

  const sortedReuses = useMemo(() => {
    if (!sortField || sortOrder === "none") return filteredReuses;
    const dir = sortOrder === "ascending" ? 1 : -1;
    const collator = new Intl.Collator("pt", { sensitivity: "base" });
    return [...filteredReuses].sort((a, b) => {
      if (sortField === "title") {
        return collator.compare(a.title ?? "", b.title ?? "") * dir;
      }
      if (sortField === "created_at") {
        const at = a.created_at ? Date.parse(a.created_at) : 0;
        const bt = b.created_at ? Date.parse(b.created_at) : 0;
        return (at - bt) * dir;
      }
      const ad = a.datasets?.length ?? 0;
      const bd = b.datasets?.length ?? 0;
      return (ad - bd) * dir;
    });
  }, [filteredReuses, sortField, sortOrder]);

  const paginatedReuses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedReuses.slice(start, start + itemsPerPage);
  }, [sortedReuses, currentPage, itemsPerPage]);

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: displayName || "...", url: "#" },
        { label: "Reutilizações", url: "/pages/admin/me/reuses" },
      ]}
      title="Reutilizações"
      isLoading={isLoading}
      count={filteredReuses.length}
      currentPage={currentPage}
      pageSize={itemsPerPage}
      setCurrentPage={setCurrentPage}
      setPageSize={setItemsPerPage}
      search={{
        placeholder: "Pesquise o nome da reutilização",
        ariaLabel: "Pesquisar reutilizações",
        onChange: handleSearch,
      }}
      filters={
        <StatusFilterSelect
          value={statusFilter}
          defaultValue={statusFilter || undefined}
          onChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
        />
      }
      emptyState={
        <AdminEmptyState
          icon="bar_chart"
          title="Sem reutilizações"
          description="Não publicou reutilizações"
          createUrl="/pages/admin/reuses/new"
        />
      }
    >
      <TableHeader>
        <TableRow>
          <TableHeaderCell
            sortType="numeric"
            sortOrder={getSortOrder("title")}
            onSortChange={handleSort("title")}
          >
            Título da reutilização
          </TableHeaderCell>
          <TableHeaderCell>Estado</TableHeaderCell>
          <TableHeaderCell
            sortType="date"
            sortOrder={getSortOrder("created_at")}
            onSortChange={handleSort("created_at")}
          >
            Criado em
          </TableHeaderCell>
          <TableHeaderCell
            sortType="numeric"
            sortOrder={getSortOrder("datasets")}
            onSortChange={handleSort("datasets")}
          >
            Conjuntos de dados
          </TableHeaderCell>
          <TableHeaderCell>Ações</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {paginatedReuses.map((reuse) => (
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
        ))}
      </TableBody>
    </AdminListPage>
  );
}
