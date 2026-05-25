"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Breadcrumb,
  CardNoResults,
  Icon,
  InputSearchBar,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@ama-pt/agora-design-system";
import { StatusFilterSelect } from "@/components/admin/StatusFilterSelect";
import { ResourceStatusBadge } from "@/components/admin/ResourceStatusBadge";
import { fetchReuses } from "@/services/api";
import { Reuse } from "@/types/api";
import PublishDropdown from "@/components/admin/PublishDropdown";
import { formatDateToDMY } from "@/utils/formatDate";
import TextLink from "@/components/Primitives/TextLink";
import { createPaginationProps } from "@/utils/createPaginationProps";
import { filterByStatus } from "@/utils/filterByStatus";
import ResultsCount from "../ResultsCount";
import TableActionsCell from "../TableActionsCell";

type SortOrder = "none" | "ascending" | "descending";
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
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sortParam = useMemo(() => {
    if (!sortField || sortOrder === "none") return undefined;
    const apiField = SORT_FIELD_MAP[sortField];
    return `${sortOrder === "descending" ? "-" : ""}${apiField}`;
  }, [sortField, sortOrder]);

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

  const handleSearch = (value: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearchQuery(value);
      setCurrentPage(1);
    }, 400);
  };

  const filteredReuses = useMemo(
    () => filterByStatus(reuses, statusFilter),
    [reuses, statusFilter]
  );

  return (
    <div className="admin-page">
      <div className="admin-page__breadcrumb">
        <Breadcrumb
          items={[
            { label: "Administração", url: "/pages/admin" },
            { label: "Sistema", url: "#" },
            { label: "Reutilizações", url: "/pages/admin/system/reuses" },
          ]}
        />
      </div>

      <div className="admin-page__header">
        <h1 className="admin-page__title">Reutilizações</h1>
        <PublishDropdown />
      </div>

      <ResultsCount count={totalItems} isLoading={isLoading} />

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
        <StatusFilterSelect value={statusFilter} onChange={(v) => setStatusFilter(v)} />
      </div>

      {isLoading ? (
        <p className="text-sm text-neutral-700">A carregar...</p>
      ) : filteredReuses.length > 0 ? (
        <Table
          paginationProps={createPaginationProps(
            pageSize,
            totalItems,
            currentPage,
            setCurrentPage,
            setPageSize
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
              <TableHeaderCell>Conjuntos de dados</TableHeaderCell>
              <TableHeaderCell>Ações</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReuses.map((reuse) => {
              return (
                <TableRow key={reuse.id}>
                  <TableCell headerLabel="Título">
                    <TextLink href={`/pages/reuses/${reuse.slug}`}>{reuse.title}</TextLink>
                  </TableCell>
                  <TableCell headerLabel="Estado">
                    <ResourceStatusBadge item={reuse} />
                  </TableCell>
                  <TableCell headerLabel="Criado em">{formatDateToDMY(reuse.created_at)}</TableCell>
                  <TableCell headerLabel="Conjuntos de dados">
                    {reuse.datasets?.length ?? 0}
                  </TableCell>
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
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <CardNoResults
          position="center"
          icon={<Icon name="agora-line-edit" className="icon-xl h-12 w-12 text-primary-500" />}
          title="Sem reutilizações"
          description="Nenhuma reutilização encontrada."
          hasAnchor={false}
        />
      )}
    </div>
  );
}
