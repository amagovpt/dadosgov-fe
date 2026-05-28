"use client";

import { useCallback, useEffect, useState } from "react";
import {
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  ProgressBar,
} from "@ama-pt/agora-design-system";
import { StatusFilterSelect } from "@/components/admin/StatusFilterSelect";
import { ResourceStatusBadge } from "@/components/admin/ResourceStatusBadge";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import { fetchAdminDatasets, fetchDatasets } from "@/services/api";
import { Dataset } from "@/types/api";
import { calculateQualityScore } from "@/utils/calculateQualityScore";
import TextLink from "@/components/Primitives/TextLink";
import { SortOrder, useSortControls } from "@/components/admin/lists/useClientTableState";
import { useDebouncedSearch } from "@/components/admin/lists/useDebouncedSearch";
import AdminEmptyState from "../AdminEmptyState";
import TableActionsCell from "../TableActionsCell";
import { QUALITY_CRITERIA } from "@/utils/datasetQuality";

type SortField = "title" | "created_at" | "last_modified" | "resources";

const SORT_FIELD_MAP: Record<SortField, string | null> = {
  title: "title",
  created_at: "created",
  last_modified: "last_update",
  resources: null,
};

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

export default function SystemDatasetsClient() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadDatasets = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiSort = sortField ? SORT_FIELD_MAP[sortField] : null;
      const sortParam =
        sortOrder === "none" || !apiSort
          ? undefined
          : `${sortOrder === "descending" ? "-" : ""}${apiSort}`;

      const statusFilters: { private?: boolean; archived?: boolean; deleted?: boolean } = {};
      if (statusFilter === "public") {
        statusFilters.private = false;
        statusFilters.archived = false;
        statusFilters.deleted = false;
      }
      if (statusFilter === "draft") {
        statusFilters.private = true;
        statusFilters.archived = false;
        statusFilters.deleted = false;
      }
      if (statusFilter === "archived") {
        statusFilters.archived = true;
        statusFilters.deleted = false;
      }
      if (statusFilter === "deleted") {
        statusFilters.deleted = true;
      }

      const filters = {
        q: searchQuery.trim() || undefined,
        sort: sortParam,
        ...statusFilters,
      };

      let response = await fetchAdminDatasets(currentPage, pageSize, filters);
      if (response.total === 0 && !searchQuery.trim() && !statusFilter) {
        response = await fetchDatasets(currentPage, pageSize, filters);
      }
      setDatasets(response.data || []);
      setTotalItems(response.total || 0);
    } catch (error) {
      console.error("Error loading datasets:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, sortField, sortOrder, statusFilter]);

  useEffect(() => {
    loadDatasets();
  }, [loadDatasets]);

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
        { label: "Sistema", url: "#" },
        { label: "Conjuntos de dados", url: "/pages/admin/system/datasets" },
      ]}
      title="Conjuntos de dados"
      isLoading={isLoading}
      count={totalItems}
      hasItems={datasets.length > 0}
      currentPage={currentPage}
      pageSize={pageSize}
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
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
      emptyState={
        <AdminEmptyState
          icon="agora-line-edit"
          title="Sem publicações"
          description="Nenhum conjunto de dados encontrado."
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
            Título do conjunto de dados
          </TableHeaderCell>
          <TableHeaderCell>Estado</TableHeaderCell>
          <TableHeaderCell
            sortType="numeric"
            sortOrder={getSortOrder("created_at")}
            onSortChange={handleSort("created_at")}
          >
            Criado em
          </TableHeaderCell>
          <TableHeaderCell
            sortType="numeric"
            sortOrder={getSortOrder("last_modified")}
            onSortChange={handleSort("last_modified")}
          >
            Última modificação
          </TableHeaderCell>
          <TableHeaderCell>Ficheiros</TableHeaderCell>
          <TableHeaderCell>Pontuação</TableHeaderCell>
          <TableHeaderCell>Ações</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {datasets.map((dataset) => {
          const score = calculateQualityScore(QUALITY_CRITERIA, dataset.quality);

          return (
            <TableRow key={dataset.id}>
              <TableCell headerLabel="Título">
                <TextLink href={`/pages/datasets/${dataset.slug}`}>{dataset.title}</TextLink>
              </TableCell>
              <TableCell headerLabel="Estado">
                <ResourceStatusBadge item={dataset} />
              </TableCell>
              <TableCell headerLabel="Criado em">{formatDate(dataset.created_at)}</TableCell>
              <TableCell headerLabel="Última modificação">
                {formatDate(dataset.last_modified)}
              </TableCell>
              <TableCell headerLabel="Ficheiros">{dataset.resources?.length || 0}</TableCell>
              <TableCell headerLabel="Pontuação">
                <div
                  className={
                    score <= 45 ? "quality-progress-warning" : score > 50 ? "quality-progress-success" : ""
                  }
                >
                  <ProgressBar value={score} max={100} hidePercentageValue={true} />
                </div>
                <span className="text-xs text-neutral-700">{score}%</span>
              </TableCell>
              <TableCell headerLabel="Ações">
                <TableActionsCell
                  viewAction={{
                    href: `/pages/datasets/${dataset.slug}`,
                  }}
                  editAction={{
                    href: `/pages/admin/datasets/${dataset.id}`,
                  }}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </AdminListPage>
  );
}
