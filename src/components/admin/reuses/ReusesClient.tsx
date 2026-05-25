"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  InputSearchBar,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@ama-pt/agora-design-system";
import { ResourceStatusBadge } from "@/components/admin/ResourceStatusBadge";
import { fetchMyReuses } from "@/services/api";
import { Reuse } from "@/types/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatDateToDMY } from "@/utils/formatDate";
import TextLink from "@/components/Primitives/TextLink";
import { createPaginationProps } from "@/utils/createPaginationProps";
import { filterByStatus } from "@/utils/filterByStatus";
import AdminEmptyState from "../AdminEmptyState";
import ResultsCount from "../ResultsCount";
import StatusFilterSelect from "../StatusFilterSelect";
import TableActionsCell from "../TableActionsCell";
import AdminLayout from "@/components/Layout/AdminLayout";

type SortOrder = "none" | "ascending" | "descending";
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
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSort = (field: ReuseSortField) => (newOrder: SortOrder) => {
    setSortField(newOrder === "none" ? null : field);
    setSortOrder(newOrder);
    setCurrentPage(1);
  };

  const getSortOrder = (field: ReuseSortField): SortOrder =>
    sortField === field ? sortOrder : "none";

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

  const handleSearch = (value: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearchQuery(value);
      setCurrentPage(1);
    }, 400);
  };

  const filteredReuses = useMemo(() => {
    let result = reuses;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((r) => r.title.toLowerCase().includes(q));
    }
    if (statusFilter) {
      result = filterByStatus(result, statusFilter);
    } else {
      // By default, hide deleted reuses (same behavior as datasets page).
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
    <AdminLayout breadcrumbItems={[
      { label: "Administração", url: "/pages/admin" },
      { label: displayName || "...", url: "#" },
      { label: "Reutilizações", url: "/pages/admin/me/reuses" },
    ]}
      title="Reutilizações"
    >

      <ResultsCount count={filteredReuses.length} isLoading={isLoading} />

      <div className="mb-24 flex items-end gap-16">
        <div className="admin-search-wrapper">
          <InputSearchBar
            hasVoiceActionButton={false}
            label="Pesquisar"
            placeholder="Pesquise o nome da reutilização"
            aria-label="Pesquisar reutilizações"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              handleSearch(e.target.value);
            }}
          />
        </div>
        <StatusFilterSelect
          value={statusFilter}
          defaultValue={statusFilter || undefined}
          onChange={(v) => {
            setStatusFilter(v);
            setCurrentPage(1);
          }}
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-neutral-700">A carregar...</p>
      ) : filteredReuses.length > 0 ? (
        <Table
          paginationProps={createPaginationProps(
            itemsPerPage,
            sortedReuses.length,
            currentPage,
            setCurrentPage,
            setItemsPerPage
          )}
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
            {paginatedReuses.map((reuse) => {
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
                  <TableCell headerLabel="Conjuntos de dados">
                    {reuse.datasets?.length ?? 0}
                  </TableCell>
                  <TableCell headerLabel="Ações">
                    <TableActionsCell
                      viewAction={{ href: `/pages/reuses/${reuse.slug}` }}
                      editAction={{ href: `/pages/admin/me/reuses/edit?id=${reuse.id}` }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <AdminEmptyState
          icon="bar_chart"
          title="Sem reutilizações"
          description="Não publicou reutilizações"
          createUrl="/pages/admin/reuses/new"
        />
      )}
    </AdminLayout>
  );
}
