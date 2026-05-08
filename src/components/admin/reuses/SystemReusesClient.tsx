"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Breadcrumb,
  CardNoResults,
  Icon,
  InputSelect,
  InputSearchBar,
  DropdownSection,
  DropdownOption,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@ama-pt/agora-design-system";
import StatusDot from "@/components/admin/StatusDot";
import { fetchReuses } from "@/services/api";
import { Reuse } from "@/types/api";
import PublishDropdown from "@/components/admin/PublishDropdown";

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
};

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
    loadData();
  }, [loadData]);

  const handleSearch = (value: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearchQuery(value);
      setCurrentPage(1);
    }, 400);
  };

  const filteredReuses = useMemo(() => {
    if (!statusFilter) return reuses;
    return reuses.filter((r) => {
      switch (statusFilter) {
        case "public":
          return !r.private && !r.archived && !r.deleted;
        case "draft":
          return r.private && !r.archived && !r.deleted;
        case "archived":
          return !!r.archived && !r.deleted;
        case "deleted":
          return !!r.deleted;
        default:
          return true;
      }
    });
  }, [reuses, statusFilter]);

  const getStatus = (reuse: Reuse) => {
    if (reuse.deleted) return { label: "Excluído", variant: "danger" as const };
    if (reuse.archived) return { label: "Arquivado", variant: "neutral" as const };
    if (reuse.private) return { label: "Rascunho", variant: "warning" as const };
    return { label: "Público", variant: "success" as const };
  };

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

      <p className="text-neutral-700 text-sm mb-16">
        {totalItems} resultados
      </p>

      <div className="flex items-end gap-16 mb-24">
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
        <InputSelect
          label=""
          hideLabel
          placeholder="Filtrar por estado"
          id="filter-status"
          onChange={(options) => {
            setStatusFilter(
              options.length > 0 ? (options[0].value as string) : ""
            );
          }}
        >
          <DropdownSection name="status">
            <DropdownOption value="" selected={statusFilter === ""}>Todos</DropdownOption>
            <DropdownOption value="public" selected={statusFilter === "public"}>Público</DropdownOption>
            <DropdownOption value="archived" selected={statusFilter === "archived"}>Arquivado</DropdownOption>
            <DropdownOption value="draft" selected={statusFilter === "draft"}>Rascunho</DropdownOption>
            <DropdownOption value="deleted" selected={statusFilter === "deleted"}>Excluído</DropdownOption>
          </DropdownSection>
        </InputSelect>
      </div>

      {isLoading ? (
        <p className="text-neutral-700 text-sm">A carregar...</p>
      ) : filteredReuses.length > 0 ? (
        <Table
          paginationProps={{
            itemsPerPageLabel: "Linhas por página",
            itemsPerPage: pageSize,
            totalItems: totalItems,
            availablePageSizes: [5, 10, 20],
            currentPage: currentPage - 1,
            buttonDropdownAriaLabel: "Selecionar linhas por página",
            dropdownListAriaLabel: "Opções de linhas por página",
            prevButtonAriaLabel: "Página anterior",
            nextButtonAriaLabel: "Próxima página",
            onPageChange: (page: number) => setCurrentPage(page + 1),
            onPageSizeChange: (size: number) => {
              setPageSize(size);
              setCurrentPage(1);
            },
          }}
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
              const status = getStatus(reuse);
              return (
                <TableRow key={reuse.id}>
                  <TableCell headerLabel="Título">
                    <a
                      href={`/pages/reuses/${reuse.slug}`}
                      className="text-primary-600 underline"
                    >
                      {reuse.title}
                    </a>
                  </TableCell>
                  <TableCell headerLabel="Estado">
                    <StatusDot variant={status.variant}>
                      {status.label}
                    </StatusDot>
                  </TableCell>
                  <TableCell headerLabel="Criado em">
                    {formatDate(reuse.created_at)}
                  </TableCell>
                  <TableCell headerLabel="Conjuntos de dados">
                    {reuse.datasets?.length ?? 0}
                  </TableCell>
                  <TableCell headerLabel="Ações">
                    <div className="flex gap-8">
                      <a href={`/pages/reuses/${reuse.slug}`}>
                        <Icon
                          name="agora-line-eye"
                          className="w-[20px] h-[20px]"
                        />
                      </a>
                      <a href={`/pages/admin/reuses/${reuse.id}`}>
                        <Icon
                          name="agora-line-edit"
                          className="w-[20px] h-[20px]"
                        />
                      </a>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <CardNoResults
          position="center"
          icon={
            <Icon
              name="agora-line-edit"
              className="w-12 h-12 text-primary-500 icon-xl"
            />
          }
          title="Sem reutilizações"
          description="Nenhuma reutilização encontrada."
          hasAnchor={false}
        />
      )}
    </div>
  );
}
