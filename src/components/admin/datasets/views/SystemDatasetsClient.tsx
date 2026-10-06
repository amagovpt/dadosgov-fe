"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StatusFilterSelect } from "@/components/admin/StatusFilterSelect";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import { buildApiSortParam } from "@/utils/admin-lists/listHelpers";
import { SortOrder, useSortControls } from "@/hooks/admin-lists/useClientTableState";
import { useDebouncedSearch } from "@/hooks/admin-lists/useDebouncedSearch";
import {
  createDatasetColumns,
  DatasetSortField,
  sortDatasets,
  systemDatasetSortFieldMap,
} from "@/components/admin/datasets/config/datasetsListConfig";
import { fetchAdminDatasets, fetchDatasets } from "@/service/api/datasets";
import { Dataset } from "@/service/types/dataset";
import type { DatasetFilters } from "@/service/types/dataset";
import {
  buildCsvFilename,
  buildCsvFromColumns,
  downloadCsv,
} from "@/utils/admin-lists/csvExport";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import type { BoDatasetsPage } from "@/service/types/admin/datasets";

interface SystemDatasetsClientProps {
  pageContent: BoDatasetsPage;
}

export default function SystemDatasetsClient({ pageContent }: SystemDatasetsClientProps) {
  const { t } = useTranslation(["admin-common", "admin-datasets"]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<DatasetSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const usesLocalSort = sortField === "status" || sortField === "quality" || sortField === "resources";

  const sortParam = useMemo(
    () => (usesLocalSort ? undefined : buildApiSortParam(sortField, sortOrder, systemDatasetSortFieldMap)),
    [sortField, sortOrder, usesLocalSort],
  );
  const columns = useMemo(
    () =>
      createDatasetColumns({
        editHref: (dataset) => `/admin/datasets/${dataset.id}`,
        showResourceCount: true,
        showQualityScore: true,
        labels: {
          title: t("admin-datasets:list.columns.title"),
          titleShort: t("admin-datasets:list.columns.titleShort"),
          status: t("admin-datasets:list.columns.status"),
          createdAt: t("admin-datasets:list.columns.createdAt"),
          lastModified: t("admin-datasets:list.columns.lastModified"),
          resources: t("admin-datasets:list.columns.resources"),
          quality: t("admin-datasets:list.columns.quality"),
          actions: t("admin-datasets:list.columns.actions"),
        },
        statusLabels: {
          public: t("admin-common:status.public"),
          draft: t("admin-common:status.draft"),
          archived: t("admin-common:status.archived"),
          deleted: t("admin-common:status.deleted"),
        },
      }),
    [t],
  );

  const filters = useMemo<DatasetFilters>(() => {
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

    return {
      q: searchQuery.trim() || undefined,
      sort: sortParam,
      ...statusFilters,
    };
  }, [searchQuery, sortParam, statusFilter]);
  const hasFilters = Boolean(searchQuery.trim() || statusFilter);

  // Falls back to the public endpoint when the admin one is empty. Used by the table and the CSV.
  const fetchDatasetsPage = useCallback(
    async (page: number, size: number) => {
      const response = await fetchAdminDatasets(page, size, filters);
      if (response.total === 0 && !hasFilters) {
        return fetchDatasets(page, size, filters);
      }
      return response;
    },
    [filters, hasFilters],
  );

  const loadDatasets = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchDatasetsPage(currentPage, pageSize);
      setDatasets(response.data || []);
      setTotalItems(response.total || 0);
    } catch (error) {
      console.error("Error loading datasets:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, fetchDatasetsPage, pageSize]);

  // One request with page_size = the total the table already received.
  const handleDownloadCsv = useCallback(async () => {
    const response = await fetchDatasetsPage(1, totalItems);
    const allDatasets = response.data ?? [];
    // The fetchers return an empty page on error.
    if (totalItems > 0 && allDatasets.length === 0) {
      throw new Error(t("admin-common:csvExport.fetchError"));
    }
    const rows = usesLocalSort ? sortDatasets(allDatasets, sortField, sortOrder) : allDatasets;
    downloadCsv(
      buildCsvFilename(t("admin-datasets:list.title")),
      buildCsvFromColumns(rows, columns),
    );
  }, [columns, fetchDatasetsPage, sortField, sortOrder, t, totalItems, usesLocalSort]);

  useEffect(() => {
    let isCancelled = false;

    const loadCurrentDatasets = async () => {
      if (isCancelled) return;
      await loadDatasets();
    };

    void loadCurrentDatasets();

    return () => {
      isCancelled = true;
    };
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
    setCurrentPage,
  );
  const visibleDatasets = useMemo(
    () => (usesLocalSort ? sortDatasets(datasets, sortField, sortOrder) : datasets),
    [datasets, sortField, sortOrder, usesLocalSort],
  );

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: t("admin-datasets:list.title"), url: "/admin/system/datasets" },
      ]}
      title={t("admin-datasets:list.title")}
      isLoading={isLoading}
      count={totalItems}
      hasItems={visibleDatasets.length > 0}
      currentPage={currentPage}
      pageSize={pageSize}
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
      search={{
        label: pageContent.search?.label,
        placeholder: pageContent.search?.placeholder ?? "",
        hint: pageContent.search?.hint,
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
      emptyState={<AdminEmptyState noResults={pageContent.systemNoResults} />}
      onDownloadCsv={handleDownloadCsv}
    >
      <AdminListTable
        items={visibleDatasets}
        columns={columns}
        getSortOrder={getSortOrder}
        handleSort={handleSort}
        getRowKey={(dataset) => dataset.id}
      />
    </AdminListPage>
  );
}
