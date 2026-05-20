"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  Button,
} from "@ama-pt/agora-design-system";
import StatusDot from "@/components/admin/StatusDot";
import { fetchMyReuses } from "@/api/reuses/route";
import { Reuse } from "@/types/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import PublishDropdown from "@/components/admin/PublishDropdown";
import { formatDateToDMY } from "@/utils/formatDate";

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
      return result.filter((r) => {
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
    }

    // By default, hide deleted reuses (same behavior as datasets page).
    return result.filter((r) => !r.deleted);
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
            { label: displayName || "...", url: "#" },
            { label: "Reutilizações", url: "/pages/admin/me/reuses" },
          ]}
        />
      </div>

      <div className="admin-page__header">
        <h1 className="admin-page__title">Reutilizações</h1>
        <PublishDropdown />
      </div>

      <p className="text-neutral-700 text-sm mb-16">
        {isLoading ? "A carregar..." : `${filteredReuses.length} resultados`}
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
          defaultValue={statusFilter || undefined}
          onChange={(options) => {
            setStatusFilter(options.length > 0 ? (options[0].value as string) : "");
            setCurrentPage(1);
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
            itemsPerPageLabel: "Itens por página",
            itemsPerPage: itemsPerPage,
            totalItems: sortedReuses.length,
            availablePageSizes: [5, 10, 20],
            currentPage: currentPage - 1,
            buttonDropdownAriaLabel: "Selecionar linhas por página",
            dropdownListAriaLabel: "Opções de linhas por página",
            prevButtonAriaLabel: "Página anterior",
            nextButtonAriaLabel: "Próxima página",
            onPageChange: (page: number) => setCurrentPage(page + 1),
            onPageSizeChange: (size: number) => {
              setItemsPerPage(size);
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
                    <StatusDot variant={status.variant}>{status.label}</StatusDot>
                  </TableCell>
                  <TableCell headerLabel="Criado em">
                    {formatDateToDMY(reuse.created_at)}
                    <br />
                    <span className="text-sm text-neutral-500">
                      {reuse.owner ? (
                        <a
                          href={`/pages/users/${reuse.owner.slug}`}
                          className="text-primary-600 text-xs underline"
                        >
                          {reuse.owner.first_name} {reuse.owner.last_name}
                        </a>
                      ) : (
                        "—"
                      )}
                    </span>
                  </TableCell>
                  <TableCell headerLabel="Conjuntos de dados">
                    {reuse.datasets?.length ?? 0}
                  </TableCell>
                  <TableCell headerLabel="Ações">
                    <div className="flex gap-8">
                      <a href={`/pages/reuses/${reuse.slug}`}>
                        <Icon name="agora-line-eye" className="w-[20px] h-[20px]" />
                      </a>
                      <a href={`/pages/admin/me/reuses/edit?id=${reuse.id}`}>
                        <Icon name="agora-line-edit" className="w-[20px] h-[20px]" />
                      </a>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="datasets-page__body">
          <div className="datasets-page__content">
            <CardNoResults
              className="datasets-page__empty"
              position="center"
              icon={
                <img src="/Icons/bar_chart.svg" alt="" className="w-40 h-40" />
              }
              title="Sem reutilizações"
              description="Não publicou reutilizações"
              hasAnchor={false}
              extraDescription={
                <div className="mt-24">
                  <Button
                    variant="primary"
                    appearance="outline"
                    onClick={() => window.location.href = '/pages/admin/reuses/new'}
                  >
                    Publique no portal
                  </Button>
                </div>
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
