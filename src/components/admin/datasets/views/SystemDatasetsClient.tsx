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
  systemDatasetSortFieldMap,
} from "@/components/admin/datasets/config/datasetsListConfig";
import { fetchAdminDatasets, fetchDatasets } from "@/service/api/datasets";
import { Dataset } from "@/service/types/dataset";
import AdminSquidexEmptyState from "@/components/admin/lists/AdminSquidexEmptyState";
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

  const sortParam = useMemo(
    () => buildApiSortParam(sortField, sortOrder, systemDatasetSortFieldMap),
    [sortField, sortOrder],
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
      }),
    [t],
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

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: t("admin-common:breadcrumbs.administration"), url: "/admin" },
        { label: t("admin-common:breadcrumbs.system"), url: "#" },
        { label: t("admin-datasets:list.title"), url: "/admin/system/datasets" },
      ]}
      title={t("admin-datasets:list.title")}
      isLoading={isLoading}
      count={totalItems}
      hasItems={datasets.length > 0}
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
      emptyState={<AdminSquidexEmptyState noResults={pageContent.systemNoResults} />}
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
