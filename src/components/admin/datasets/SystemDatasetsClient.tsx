"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { StatusFilterSelect } from "@/components/admin/StatusFilterSelect";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import { buildApiSortParam } from "@/components/admin/lists/listHelpers";
import { SortOrder, useSortControls } from "@/components/admin/lists/useClientTableState";
import { useDebouncedSearch } from "@/components/admin/lists/useDebouncedSearch";
import {
  createDatasetColumns,
  DatasetSortField,
  systemDatasetSortFieldMap,
} from "./datasetsListConfig";
import { fetchAdminDatasets, fetchDatasets } from "@/service/api/datasets";
import { Dataset } from "@/service/types/dataset";
import AdminEmptyState from "../AdminEmptyState";

export default function SystemDatasetsClient() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<DatasetSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const sortParam = useMemo(
    () => buildApiSortParam(sortField, sortOrder, systemDatasetSortFieldMap),
    [sortField, sortOrder]
  );
  const columns = useMemo(
    () =>
      createDatasetColumns({
        editHref: (dataset) => `/pages/admin/datasets/${dataset.id}`,
        showResourceCount: true,
        showQualityScore: true,
      }),
    []
  );

  const loadDatasets = useCallback(async () => {
    setIsLoading(true);
    try {
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
  }, [currentPage, pageSize, searchQuery, sortParam, statusFilter]);

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
      <AdminListTable
        items={datasets}
        columns={columns}
        getSortOrder={getSortOrder}
        handleSort={handleSort}
        getRowKey={(dataset) => dataset.id}
      />
    </AdminListPage>
  );
}
