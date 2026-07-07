"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { StatusFilterSelect } from "@/components/admin/StatusFilterSelect";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import { paginateItems } from "@/utils/admin-lists/listHelpers";
import { fetchMyDatasets } from "@/service/api/datasets";
import { Dataset } from "@/service/types/dataset";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { filterByStatus } from "@/utils/filterByStatus";
import { SortOrder, useSortControls } from "@/hooks/admin-lists/useClientTableState";
import {
  createDatasetColumns,
  DatasetSortField,
  sortDatasets,
} from "@/components/admin/datasets/config/datasetsListConfig";
import AdminEmptyState from "@/components/admin/AdminEmptyState";

export default function DatasetsClient() {
  const { t } = useTranslation(["admin-common", "admin-datasets"]);
  const { displayName } = useCurrentUser();
  const searchParams = useSearchParams();

  const [allDatasets, setAllDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<DatasetSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get("status") ?? "");

  useEffect(() => {
    async function loadDatasets() {
      setIsLoading(true);
      try {
        const response = await fetchMyDatasets(1, 9999);
        setAllDatasets(response.data || []);
      } catch (error) {
        console.error("Error loading datasets:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadDatasets();
  }, []);

  const filteredDatasets = useMemo(() => {
    let result = allDatasets;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (dataset) =>
          dataset.title.toLowerCase().includes(q) ||
          (dataset.acronym && dataset.acronym.toLowerCase().includes(q)) ||
          dataset.slug.toLowerCase().includes(q),
      );
    }

    if (statusFilter) {
      result = filterByStatus(result, statusFilter);
    } else {
      result = result.filter((dataset) => !dataset.deleted);
    }

    return result;
  }, [allDatasets, searchQuery, statusFilter]);

  const sortedDatasets = useMemo(
    () => sortDatasets(filteredDatasets, sortField, sortOrder),
    [filteredDatasets, sortField, sortOrder],
  );
  const datasets = useMemo(
    () => paginateItems(sortedDatasets, currentPage, pageSize),
    [sortedDatasets, currentPage, pageSize],
  );
  const columns = useMemo(
    () =>
      createDatasetColumns({
        editHref: (dataset) => `/admin/me/datasets/edit?id=${dataset.id}`,
        showOwner: true,
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
        { label: displayName || "...", url: "#" },
        { label: t("admin-datasets:list.title"), url: "/admin/me/datasets" },
      ]}
      title={t("admin-datasets:list.title")}
      isLoading={isLoading}
      count={sortedDatasets.length}
      currentPage={currentPage}
      pageSize={pageSize}
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
      search={{
        placeholder: t("admin-datasets:list.searchPlaceholder"),
        ariaLabel: t("admin-datasets:list.searchAriaLabel"),
        onChange: (value) => {
          setSearchQuery(value);
          setCurrentPage(1);
        },
      }}
      filters={
        <StatusFilterSelect
          value={statusFilter}
          defaultValue={statusFilter || undefined}
          onChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
        />
      }
      emptyState={
        <AdminEmptyState
          icon="agora-line-edit"
          title={t("admin-datasets:list.emptyMineTitle")}
          description={t("admin-datasets:list.emptyMineDescription")}
          createUrl="/admin/datasets/new"
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
