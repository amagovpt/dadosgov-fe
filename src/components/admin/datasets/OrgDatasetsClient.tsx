"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Icon,
  InputSearchBar,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Button,
} from "@ama-pt/agora-design-system";

import { ResourceStatusBadge } from "@/components/admin/ResourceStatusBadge";
import { fetchOrgDatasets } from "@/service/api/organizations";
import { Dataset } from "@/service/types/dataset";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useAuth } from "@/context/AuthContext";
import { formatDateToDMY } from "@/utils/formatDate";
import AdminLayout from "@/components/Layout/AdminLayout";
import { createPaginationProps } from "@/utils/createPaginationProps";
import AdminEmptyState from "../AdminEmptyState";
import ResultsCount from "../ResultsCount";
import { StatusFilterSelect } from "@/components/admin/StatusFilterSelect";
import TableActionsCell from "../TableActionsCell";
import TextLink from "@/components/Primitives/TextLink";

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
    void (async () => {
      await loadDatasets(currentPage, itemsPerPage, searchQuery, statusFilter, sort);
    })();
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
    <AdminLayout
      breadcrumbItems={
        [
          { label: "Administração", url: "/pages/admin" },
          { label: orgName || "Organização", url: "#" },
          { label: "Conjuntos de dados", url: "#" },
        ]
      }
      title="Conjuntos de dados"
    >

      <ResultsCount count={total} isLoading={isLoading} />

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
        <StatusFilterSelect value={statusFilter} onChange={(v) => setStatusFilter(v)} />
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
          paginationProps={createPaginationProps(
            itemsPerPage,
            total,
            currentPage,
            setCurrentPage,
            setItemsPerPage
          )}
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
                  <ResourceStatusBadge item={dataset} />
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
                  <TableActionsCell
                    viewAction={{
                      href: `/pages/datasets/${dataset.slug}`,
                    }}
                    editAction={{
                      href: `/pages/admin/org/datasets/edit?slug=${dataset.slug}`,
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <AdminEmptyState
          icon="agora-line-edit"
          title="Sem publicações"
          description="A organização ainda não publicou conjuntos de dados."
          createUrl="/pages/admin/datasets/new"
        />
      )}
    </AdminLayout>
  );
}
