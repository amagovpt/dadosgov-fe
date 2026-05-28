"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CardNoResults,
  Icon,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@ama-pt/agora-design-system";
import { ResourceStatusBadge } from "@/components/admin/ResourceStatusBadge";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import { fetchReuses } from "@/services/api";
import { Reuse } from "@/types/api";
import { formatDateToDMY } from "@/utils/formatDate";
import TextLink from "@/components/Primitives/TextLink";
import { filterByStatus } from "@/utils/filterByStatus";
import { SortOrder, useSortControls } from "@/components/admin/lists/useClientTableState";
import { useDebouncedSearch } from "@/components/admin/lists/useDebouncedSearch";
import StatusFilterSelect from "../StatusFilterSelect";
import TableActionsCell from "../TableActionsCell";

type ReuseSortField = "title" | "created_at";

const SORT_FIELD_MAP: Record<ReuseSortField, string> = {
  title: "title",
  created_at: "created",
};

export default function SystemReusesClient() {
  const [reuses, setReuses] = useState<Reuse[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState<ReuseSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");

  const sortParam = useMemo(() => {
    if (!sortField || sortOrder === "none") return undefined;
    const apiField = SORT_FIELD_MAP[sortField];
    return `${sortOrder === "descending" ? "-" : ""}${apiField}`;
  }, [sortField, sortOrder]);

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
      const response = await fetchReuses(currentPage, pageSize, {
        q: searchQuery.trim() || undefined,
        sort: sortParam,
      });
      setReuses(response.data || []);
      setTotalItems(response.total || 0);
    } catch (error) {
      console.error("Error loading reuses:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, sortParam]);

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

  const filteredReuses = useMemo(
    () => filterByStatus(reuses, statusFilter),
    [reuses, statusFilter]
  );

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: "Sistema", url: "#" },
        { label: "Reutilizações", url: "/pages/admin/system/reuses" },
      ]}
      title="Reutilizações"
      isLoading={isLoading}
      count={totalItems}
      hasItems={filteredReuses.length > 0}
      currentPage={currentPage}
      pageSize={pageSize}
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
      search={{
        placeholder: "Pesquise o nome da reutilização",
        ariaLabel: "Pesquisar reutilizações",
        onChange: handleSearch,
      }}
      filters={
        <StatusFilterSelect
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
        />
      }
      emptyState={
        <CardNoResults
          position="center"
          icon={<Icon name="agora-line-edit" className="icon-xl h-12 w-12 text-primary-500" />}
          title="Sem reutilizações"
          description="Nenhuma reutilização encontrada."
          hasAnchor={false}
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
          <TableHeaderCell>Conjuntos de dados</TableHeaderCell>
          <TableHeaderCell>Ações</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredReuses.map((reuse) => (
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
                viewAction={{
                  href: `/pages/reuses/${reuse.slug}`,
                }}
                editAction={{
                  href: `/pages/admin/reuses/${reuse.id}`,
                }}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </AdminListPage>
  );
}
