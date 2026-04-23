"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
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
import { fetchOrgReuses } from "@/services/api";
import { Reuse } from "@/types/api";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useAuth } from "@/context/AuthContext";
import PublishDropdown from "@/components/admin/PublishDropdown";

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
};

export default function OrgReusesClient() {
  const params = useParams();
  const routeOrgId = (params?.orgId as string | undefined) ?? undefined;
  const { activeOrg, isLoading: isOrgLoading } = useActiveOrganization();
  const resolvedOrgId = routeOrgId ?? activeOrg?.id;
  const { user } = useAuth();
  const orgName = useViewedOrganizationName(resolvedOrgId, user?.organizations);

  const [reuses, setReuses] = useState<Reuse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (!resolvedOrgId) {
      setIsLoading(false);
      return;
    }
    async function loadReuses() {
      setIsLoading(true);
      try {
        const data = await fetchOrgReuses(resolvedOrgId!);
        setReuses(data || []);
      } catch (error) {
        console.error("Error loading org reuses:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadReuses();
  }, [resolvedOrgId]);

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

  const paginatedReuses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredReuses.slice(start, start + itemsPerPage);
  }, [filteredReuses, currentPage, itemsPerPage]);

  if (!isOrgLoading && !resolvedOrgId) {
    return (
      <div className="admin-page">
        <CardNoResults
          className="datasets-page__empty"
          position="center"
          icon={
            <Icon name="agora-line-buildings" className="w-12 h-12 text-primary-500 icon-xl" />
          }
          title="Sem organizações"
          description="Não pertence a nenhuma organização."
          hasAnchor={false}
        />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page__breadcrumb">
        <Breadcrumb
          items={[
            { label: "Administração", url: "/pages/admin" },
            { label: orgName || "Organização", url: "#" },
            { label: "Reutilizações", url: "#" },
          ]}
        />
      </div>

      <div className="admin-page__header">
        <h1 className="admin-page__title">Reutilizações</h1>
        <PublishDropdown />
      </div>

      <p className="text-neutral-700 text-sm mb-[16px]">
        {reuses.length} resultados
      </p>

      <div className="flex items-end gap-[16px] mb-[24px]">
        <div className="admin-search-wrapper">
          <InputSearchBar hasVoiceActionButton={false}
            label="Pesquisar"
            placeholder="Pesquise o nome da reutilização"
            aria-label="Pesquisar reutilizações"
          />
        </div>
        <InputSelect
          label=""
          hideLabel
          placeholder="Filtrar por estado"
          id="filter-status"
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
        <p>A carregar...</p>
      ) : reuses.length > 0 ? (
          <Table
            paginationProps={{
              itemsPerPageLabel: "Itens por página",
              itemsPerPage: itemsPerPage,
              totalItems: reuses.length,
              availablePageSizes: [10, 20, 50],
              currentPage: currentPage - 1,
              buttonDropdownAriaLabel: "Selecionar itens por página",
              dropdownListAriaLabel: "Opções de itens por página",
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
                <TableHeaderCell sortType="date" sortOrder="none">
                  Título da reutilização
                </TableHeaderCell>
                <TableHeaderCell sortType="date" sortOrder="none">
                  Estado
                </TableHeaderCell>
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
              {paginatedReuses.map((reuse, index) => (
                <TableRow key={index}>
                  <TableCell headerLabel="Título">
                    <a
                      href={`/pages/reuses/${reuse.slug}`}
                      className="text-primary-600 underline"
                    >
                      {reuse.title}
                    </a>
                  </TableCell>
                  <TableCell headerLabel="Estado">
                    <StatusDot variant="success">Público</StatusDot>
                  </TableCell>
                  <TableCell headerLabel="Criado em">
                    {formatDate(reuse.created_at)}
                  </TableCell>
                  <TableCell headerLabel="Conjuntos de dados">
                    {reuse.datasets?.length ?? 0}
                  </TableCell>
                  <TableCell headerLabel="Ações">
                    <div className="flex gap-[8px]">
                      <a href={`/pages/reuses/${reuse.slug}`}>
                        <Icon name="agora-line-eye" className="w-[20px] h-[20px]" />
                      </a>
                      <a href={`/pages/admin/org/reuses/edit?slug=${reuse.slug}`}>
                        <Icon name="agora-line-edit" className="w-[20px] h-[20px]" />
                      </a>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      ) : (
        <div className="datasets-page__body">
          <div className="datasets-page__content">
            <CardNoResults
              className="datasets-page__empty"
              position="center"
              icon={
                <Icon name="agora-line-edit" className="w-12 h-12 text-primary-500 icon-xl" />
              }
              title="Sem publicações"
              description="A organização ainda não publicou uma reutilização."
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
