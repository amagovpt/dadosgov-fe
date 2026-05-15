"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  CardNoResults,
  Icon,
  InputSelect,
  InputSearchBar,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Button,
} from "@ama-pt/agora-design-system";

import StatusDot from "@/components/admin/StatusDot";
import { fetchOrgDatasets } from "@/services/api";
import { Dataset } from "@/types/api";
import PublishDropdown from "@/components/admin/PublishDropdown";
import Breadcrumb from "@/components/Primitives/Breadcrumb/Breadcrumb";
import { Dropdown } from "@/components/Primitives/Dropdown";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useAuth } from "@/context/AuthContext";
import { formatDateToDMY } from "@/utils/formatDate";

type SortOrder = "none" | "ascending" | "descending";
type SortField = "title" | "created" | "last_update";

interface OrgDatasetsClientProps {
  orgId: string;
}

export default function OrgDatasetsClient({ orgId }: OrgDatasetsClientProps) {
  const { user } = useAuth();
  const orgName = useViewedOrganizationName(orgId, user?.organizations);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("created");
  const [sortOrder, setSortOrder] = useState<SortOrder>("descending");

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const buildSortParam = (field: SortField, order: SortOrder): string => {
    if (order === "none") return "-created";
    return order === "ascending" ? field : `-${field}`;
  };

  const loadDatasets = useCallback(async (
    page: number,
    pageSize: number,
    q: string,
    status: string,
    sort: string,
  ) => {
    setIsLoading(true);
    try {
      const filters: {
        q?: string;
        sort: string;
        private?: boolean;
        archived?: boolean;
        deleted?: boolean;
      } = { sort };

      if (q.trim()) filters.q = q.trim();
      if (status === "public") {
        filters.private = false;
        filters.archived = false;
        filters.deleted = false;
      } else if (status === "draft") {
        filters.private = true;
        filters.archived = false;
        filters.deleted = false;
      } else if (status === "archived") {
        filters.archived = true;
        filters.deleted = false;
      } else if (status === "deleted") {
        filters.deleted = true;
      }

      const response = await fetchOrgDatasets(orgId, page, pageSize, filters);
      setDatasets(response.data || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error("Error loading org datasets:", error);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    const sort = buildSortParam(sortField, sortOrder);
    loadDatasets(currentPage, itemsPerPage, searchQuery, statusFilter, sort);
  }, [currentPage, itemsPerPage, searchQuery, statusFilter, sortField, sortOrder, loadDatasets]);

  const handleSearch = (value: string) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(value);
      setCurrentPage(1);
    }, 400);
  };

  const handleStatusChange = (options: { value?: string }[]) => {
    const value = options?.[0]?.value || "";
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => (newOrder: SortOrder) => {
    setSortField(field);
    setSortOrder(newOrder);
    setCurrentPage(1);
  };

  const getSortOrder = (field: SortField): SortOrder => {
    return sortField === field ? sortOrder : "none";
  };

  return (
    <div className="admin-page">
      <div className="admin-page__breadcrumb">
        <Breadcrumb
          items={[
            { label: "Administração", url: "/pages/admin" },
            { label: orgName || "Organização", url: "#" },
            { label: "Conjuntos de dados", url: "#" },
          ]}
        />
      </div>

      <div className="admin-page__header">
        <h1 className="admin-page__title">Conjuntos de dados</h1>
        <PublishDropdown />
      </div>

      <p className="text-neutral-700 text-sm mb-16">
        {total} resultados
      </p>

      <div className="flex items-end gap-16 mb-24">
        <div className="admin-search-wrapper">
          <InputSearchBar
            hasVoiceActionButton={false}
            label="Pesquisar"
            placeholder="Pesquise o nome, código ou sigla da entidade"
            aria-label="Pesquisar conjuntos de dados"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleSearch(e.target.value)
            }
          />
        </div>
        <InputSelect
          label=""
          hideLabel
          placeholder="Filtrar por estado"
          id="filter-status"
          onChange={handleStatusChange}
        >
          <Dropdown.Section name="status">
            <Dropdown.Option value="" selected={statusFilter === ""}>Todos</Dropdown.Option>
            <Dropdown.Option value="public" selected={statusFilter === "public"}>Público</Dropdown.Option>
            <Dropdown.Option value="archived" selected={statusFilter === "archived"}>Arquivado</Dropdown.Option>
            <Dropdown.Option value="draft" selected={statusFilter === "draft"}>Rascunho</Dropdown.Option>
            <Dropdown.Option value="deleted" selected={statusFilter === "deleted"}>Excluído</Dropdown.Option>
          </Dropdown.Section>
        </InputSelect>
        <a href={`/api/1/organizations/${orgId}/catalog`} download>
          <Button
            variant="primary"
            appearance="outline"
            hasIcon
            leadingIcon="agora-line-download"
            leadingIconHover="agora-solid-download"
          >
            Catálogo
          </Button>
        </a>
      </div>

      {isLoading ? (
        <p>A carregar...</p>
      ) : datasets.length > 0 ? (
        <Table
          paginationProps={{
            itemsPerPageLabel: "Itens por página",
            itemsPerPage: itemsPerPage,
            totalItems: total,
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
              <TableHeaderCell
                sortType="date"
                sortOrder={getSortOrder("title")}
                onSortChange={handleSort("title")}
              >
                Título do conjunto de dados
              </TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
              <TableHeaderCell
                sortType="date"
                sortOrder={getSortOrder("created")}
                onSortChange={handleSort("created")}
              >
                Criado em
              </TableHeaderCell>
              <TableHeaderCell
                sortType="date"
                sortOrder={getSortOrder("last_update")}
                onSortChange={handleSort("last_update")}
              >
                Última modificação
              </TableHeaderCell>
              <TableHeaderCell>Ações</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {datasets.map((dataset) => (
              <TableRow key={dataset.id}>
                <TableCell headerLabel="Título">
                  <a
                    href={`/pages/datasets/${dataset.slug}`}
                    className="text-primary-600 underline"
                  >
                    {dataset.title}
                  </a>
                </TableCell>
                <TableCell headerLabel="Estado">
                  {dataset.deleted ? (
                    <StatusDot variant="danger">Excluído</StatusDot>
                  ) : dataset.archived ? (
                    <StatusDot variant="neutral">Arquivado</StatusDot>
                  ) : dataset.private ? (
                    <StatusDot variant="warning">Rascunho</StatusDot>
                  ) : (
                    <StatusDot variant="success">Público</StatusDot>
                  )}
                </TableCell>
                <TableCell headerLabel="Criado em">
                  {formatDateToDMY(dataset.created_at)}
                </TableCell>
                <TableCell headerLabel="Última modificação">
                  <div>
                    <div>{formatDateToDMY(dataset.last_modified)}</div>
                    {dataset.owner ? (
                      <a
                        href={`/pages/users/${dataset.owner.slug}`}
                        className="text-primary-600 text-xs underline"
                      >
                        {dataset.owner.first_name} {dataset.owner.last_name}
                      </a>
                    ) : dataset.organization ? (
                      <a
                        href={`/pages/organizations/${dataset.organization.slug}`}
                        className="text-primary-600 text-xs underline"
                      >
                        {dataset.organization.name}
                      </a>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell headerLabel="Ações">
                  <div className="flex gap-8">
                    <a href={`/pages/datasets/${dataset.slug}`}>
                      <Icon
                        name="agora-line-eye"
                        className="w-[20px] h-[20px]"
                      />
                    </a>
                    <a
                      href={`/pages/admin/org/datasets/edit?slug=${dataset.slug}`}
                    >
                      <Icon
                        name="agora-line-edit"
                        className="w-[20px] h-[20px]"
                      />
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
                <Icon
                  name="agora-line-edit"
                  className="w-12 h-12 text-primary-500 icon-xl"
                />
              }
              title="Sem publicações"
              description="A organização ainda não publicou conjuntos de dados."
              hasAnchor={false}
              extraDescription={
                <div className="mt-24">
                  <Button
                    variant="primary"
                    appearance="outline"
                    onClick={() =>
                      (window.location.href = "/pages/admin/datasets/new")
                    }
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
