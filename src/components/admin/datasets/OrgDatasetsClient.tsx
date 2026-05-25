"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CardNoResults,
  Icon,
  InputSearchBar,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Button,
} from "@ama-pt/agora-design-system";

import { fetchOrgDatasets } from "@/services/api";
import { Dataset } from "@/types/api";
import PublishDropdown from "@/components/admin/PublishDropdown";
import Breadcrumb from "@/components/Primitives/Breadcrumb/Breadcrumb";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useAuth } from "@/context/AuthContext";
import { formatDateToDMY } from "@/utils/formatDate";
import TextLink from "@/components/Primitives/TextLink";
import AdminPaginatedTable from "@/components/admin/lists/AdminPaginatedTable";
import DatasetsStatusFilterSelect from "@/components/admin/lists/DatasetsStatusFilterSelect";
import PublicationStateDot from "@/components/admin/lists/PublicationStateDot";
import { SortOrder, useSortControls } from "@/components/admin/lists/useClientTableState";
import { useDebouncedSearch } from "@/components/admin/lists/useDebouncedSearch";

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
  const [sortField, setSortField] = useState<SortField | null>("created");
  const [sortOrder, setSortOrder] = useState<SortOrder>("descending");


  const buildSortParam = (field: SortField | null, order: SortOrder): string => {
    if (order === "none") return "-created";
    if (!field) return "-created";
    return order === "ascending" ? field : `-${field}`;
  };

  const loadDatasets = useCallback(
    async (page: number, pageSize: number, q: string, status: string, sort: string) => {
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
    },
    [orgId]
  );

  useEffect(() => {
    const sort = buildSortParam(sortField, sortOrder);
    loadDatasets(currentPage, itemsPerPage, searchQuery, statusFilter, sort);
  }, [currentPage, itemsPerPage, searchQuery, statusFilter, sortField, sortOrder, loadDatasets]);

  const handleSearch = useDebouncedSearch((value: string) => {
      setSearchQuery(value);
      setCurrentPage(1);
    });

  const { handleSort, getSortOrder } = useSortControls(
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    setCurrentPage
  );

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

      <p className="text-sm mb-16 text-neutral-700">{total} resultados</p>

      <div className="mb-24 flex items-end gap-16">
        <div className="admin-search-wrapper">
          <InputSearchBar
            hasVoiceActionButton={false}
            label="Pesquisar"
            placeholder="Pesquise o nome, código ou sigla da entidade"
            aria-label="Pesquisar conjuntos de dados"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
          />
        </div>
        <DatasetsStatusFilterSelect
          statusFilter={statusFilter}
          onChange={(nextStatus) => {
            setStatusFilter(nextStatus);
            setCurrentPage(1);
          }}
        />
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
        <AdminPaginatedTable
          pageSize={itemsPerPage}
          totalItems={total}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          setPageSize={setItemsPerPage}
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
                  <TextLink href={`/pages/datasets/${dataset.slug}`}>{dataset.title}</TextLink>
                </TableCell>
                <TableCell headerLabel="Estado">
                  <PublicationStateDot
                    deleted={dataset.deleted}
                    archived={dataset.archived}
                    isPrivate={dataset.private}
                  />
                </TableCell>
                <TableCell headerLabel="Criado em">{formatDateToDMY(dataset.created_at)}</TableCell>
                <TableCell headerLabel="Última modificação">
                  <div>
                    <div>{formatDateToDMY(dataset.last_modified)}</div>
                    {dataset.owner ? (
                      <TextLink href={`/pages/users/${dataset.owner.slug}`} className="text-xs">
                        {dataset.owner.first_name} {dataset.owner.last_name}
                      </TextLink>
                    ) : dataset.organization ? (
                      <TextLink
                        href={`/pages/organizations/${dataset.organization.slug}`}
                        className="text-xs"
                      >
                        {dataset.organization.name}
                      </TextLink>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell headerLabel="Ações">
                  <div className="flex gap-8">
                    <a href={`/pages/datasets/${dataset.slug}`}>
                      <Icon name="agora-line-eye" className="h-[20px] w-[20px]" />
                    </a>
                    <a href={`/pages/admin/org/datasets/edit?slug=${dataset.slug}`}>
                      <Icon name="agora-line-edit" className="h-[20px] w-[20px]" />
                    </a>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </AdminPaginatedTable>
      ) : (
        <div className="datasets-page__body">
          <div className="datasets-page__content">
            <CardNoResults
              className="datasets-page__empty"
              position="center"
              icon={<Icon name="agora-line-edit" className="icon-xl h-12 w-12 text-primary-500" />}
              title="Sem publicações"
              description="A organização ainda não publicou conjuntos de dados."
              hasAnchor={false}
              extraDescription={
                <div className="mt-24">
                  <Button
                    variant="primary"
                    appearance="outline"
                    onClick={() => (window.location.href = "/pages/admin/datasets/new")}
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
