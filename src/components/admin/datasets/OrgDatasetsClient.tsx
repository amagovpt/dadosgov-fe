"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Button,
} from "@ama-pt/agora-design-system";

import { ResourceStatusBadge } from "@/components/admin/ResourceStatusBadge";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import { fetchOrgDatasets } from "@/services/api";
import { Dataset } from "@/types/api";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useAuth } from "@/context/AuthContext";
import { formatDateToDMY } from "@/utils/formatDate";
import AdminEmptyState from "../AdminEmptyState";
import { StatusFilterSelect } from "@/components/admin/StatusFilterSelect";
import TableActionsCell from "../TableActionsCell";
import TextLink from "@/components/Primitives/TextLink";
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
    const sort = buildSortParam(sortField ?? "created", sortOrder);
    void loadDatasets(currentPage, itemsPerPage, searchQuery, statusFilter, sort);
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
    <AdminListPage
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: orgName || "Organização", url: "#" },
        { label: "Conjuntos de dados", url: "#" },
      ]}
      title="Conjuntos de dados"
      isLoading={isLoading}
      count={total}
      hasItems={datasets.length > 0}
      currentPage={currentPage}
      pageSize={itemsPerPage}
      setCurrentPage={setCurrentPage}
      setPageSize={setItemsPerPage}
      search={{
        placeholder: "Pesquise o nome, código ou sigla da entidade",
        ariaLabel: "Pesquisar conjuntos de dados",
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
      toolbarActions={
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
      }
      emptyState={
        <AdminEmptyState
          icon="agora-line-edit"
          title="Sem publicações"
          description="A organização ainda não publicou conjuntos de dados."
          createUrl="/pages/admin/datasets/new"
        />
      }
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
    </AdminListPage>
  );
}
