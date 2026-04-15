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
  Button,
} from "@ama-pt/agora-design-system";
import StatusDot from "@/components/admin/StatusDot";
import { fetchMyReuses } from "@/services/api";
import { Reuse } from "@/types/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import PublishDropdown from "@/components/admin/PublishDropdown";


const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
};

export default function ReusesClient() {
  const { displayName } = useCurrentUser();

  const [reuses, setReuses] = useState<Reuse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    loadData();
  }, [loadData]);

  const handleSearch = (value: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 400);
  };

  const filteredReuses = useMemo(() => {
    let result = reuses;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((r) => r.title.toLowerCase().includes(q));
    }
    if (!statusFilter) return result;
    return result.filter((r) => {
      switch (statusFilter) {
        case "public":
          return !r.private && !r.archived;
        case "draft":
          return !!r.private;
        case "archived":
          return !!r.archived;
        default:
          return true;
      }
    });
  }, [reuses, searchQuery, statusFilter]);

  const getStatus = (reuse: Reuse) => {
    if (reuse.archived) return { label: "Arquivo", variant: "warning" as const };
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

      <p className="text-neutral-700 text-sm mb-[16px]">
        {filteredReuses.length} resultados
      </p>

      <div className="flex items-end gap-[16px] mb-[24px]">
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
            setStatusFilter(options.length > 0 ? (options[0].value as string) : "");
          }}
        >
          <DropdownSection name="status">
            <DropdownOption value="public">Público</DropdownOption>
            <DropdownOption value="archived">Arquivo</DropdownOption>
            <DropdownOption value="draft">Rascunho</DropdownOption>
          </DropdownSection>
        </InputSelect>
      </div>

      {isLoading ? (
        <p className="text-neutral-700 text-sm">A carregar...</p>
      ) : filteredReuses.length > 0 ? (
        <Table
          paginationProps={{
            itemsPerPageLabel: "Linhas por página",
            itemsPerPage: 5,
            totalItems: filteredReuses.length,
            availablePageSizes: [5, 10, 20],
            currentPage: 0,
            buttonDropdownAriaLabel: "Selecionar linhas por página",
            dropdownListAriaLabel: "Opções de linhas por página",
            prevButtonAriaLabel: "Página anterior",
            nextButtonAriaLabel: "Próxima página",
          }}
        >
          <TableHeader>
            <TableRow>
              <TableHeaderCell sortType="date" sortOrder="none">
                Título da reutilização
              </TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
              <TableHeaderCell sortType="date" sortOrder="none">
                Criado em
              </TableHeaderCell>
              <TableHeaderCell sortType="date" sortOrder="none">
                Conjuntos de dados
              </TableHeaderCell>
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
                    <StatusDot variant={status.variant}>{status.label}</StatusDot>
                  </TableCell>
                  <TableCell headerLabel="Criado em">
                    {formatDate(reuse.created_at)}
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
                    <div className="flex gap-[8px]">
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
                <img src="/Icons/bar_chart.svg" alt="" className="w-[40px] h-[40px]" />
              }
              title="Sem reutilizações"
              description="Não publicou reutilizações."
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
