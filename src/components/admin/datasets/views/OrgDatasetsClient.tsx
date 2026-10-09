"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@ama-pt/agora-design-system";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import { buildApiSortParam } from "@/utils/admin-lists/listHelpers";
import { fetchOrgDatasets } from "@/service/api/organizations";
import { Dataset } from "@/service/types/dataset";
import { useCsvExport } from "@/hooks/admin-lists/useCsvExport";
import { StatusFilterSelect } from "@/components/admin/StatusFilterSelect";
import { SortOrder, useSortControls } from "@/hooks/admin-lists/useClientTableState";
import { useDebouncedSearch } from "@/hooks/admin-lists/useDebouncedSearch";
import {
  createDatasetColumns,
  OrgDatasetSortField,
  sortDatasets,
} from "@/components/admin/datasets/config/datasetsListConfig";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import type { BoDatasetsPage } from "@/service/types/admin/datasets";

const ORG_DATASET_SORT_MAP: Record<OrgDatasetSortField, string | null> = {
  title: "title",
  status: null,
  created: "created",
  last_update: "last_update",
  quality: null,
};

type OrgDatasetFilters = NonNullable<Parameters<typeof fetchOrgDatasets>[3]>;

function buildOrgDatasetFilters(q: string, status: string, sort?: string): OrgDatasetFilters {
  const filters: OrgDatasetFilters = {};

  if (sort) filters.sort = sort;
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

  return filters;
}

interface OrgDatasetsClientProps {
  orgId: string;
  pageContent: BoDatasetsPage;
}

export default function OrgDatasetsClient({ orgId, pageContent }: OrgDatasetsClientProps) {
  const { t } = useTranslation(["admin-common", "admin-datasets"]);
  const downloadListCsv = useCsvExport();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState<OrgDatasetSortField | null>("created");
  const [sortOrder, setSortOrder] = useState<SortOrder>("descending");
  const usesLocalSort = sortField === "status" || sortField === "quality";
  const sortParam = useMemo(
    () => (usesLocalSort ? undefined : buildApiSortParam(sortField, sortOrder, ORG_DATASET_SORT_MAP)),
    [sortField, sortOrder, usesLocalSort],
  );

  const columns = useMemo(
    () =>
      createDatasetColumns({
        editHref: (dataset) => `/admin/org/${orgId}/datasets/edit?slug=${dataset.slug}`,
        showOwner: true,
        showOrganizationFallback: true,
        sortVariant: "org",
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
    [orgId, t],
  );

  // One request with page_size = the total the table already received.
  const handleDownloadCsv = useCallback(async () => {
    const filters = buildOrgDatasetFilters(searchQuery, statusFilter, sortParam);
    const response = await fetchOrgDatasets(orgId, 1, total, filters);
    const allDatasets = response.data ?? [];
    // The fetchers return an empty page on error.
    if (total > 0 && allDatasets.length === 0) {
      throw new Error(t("admin-common:csvExport.fetchError"));
    }
    const rows = usesLocalSort ? sortDatasets(allDatasets, sortField, sortOrder) : allDatasets;
    downloadListCsv(t("admin-datasets:list.title"), rows, columns);
  }, [
    downloadListCsv,
    columns,
    orgId,
    searchQuery,
    sortField,
    sortOrder,
    sortParam,
    statusFilter,
    t,
    total,
    usesLocalSort,
  ]);

  const loadDatasets = useCallback(
    async (
      page: number,
      pageSize: number,
      q: string,
      status: string,
      sort?: string,
    ) => {
      setIsLoading(true);
      try {
        const filters = buildOrgDatasetFilters(q, status, sort);
        const response = await fetchOrgDatasets(orgId, page, pageSize, filters);
        setDatasets(response.data || []);
        setTotal(response.total || 0);
      } catch (error) {
        console.error("Error loading org datasets:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [orgId],
  );

  useEffect(() => {
    let isCancelled = false;

    const loadCurrentDatasets = async () => {
      if (isCancelled) return;
      await loadDatasets(
        currentPage,
        itemsPerPage,
        searchQuery,
        statusFilter,
        sortParam,
      );
    };

    void loadCurrentDatasets();

    return () => {
      isCancelled = true;
    };
  }, [currentPage, itemsPerPage, searchQuery, statusFilter, sortParam, loadDatasets]);

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
    () =>
      sortField === "status" || sortField === "quality"
        ? sortDatasets(datasets, sortField, sortOrder)
        : datasets,
    [datasets, sortField, sortOrder],
  );

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: t("admin-datasets:list.title"), url: "#" },
      ]}
      title={t("admin-datasets:list.title")}
      isLoading={isLoading}
      count={total}
      hasItems={visibleDatasets.length > 0}
      currentPage={currentPage}
      pageSize={itemsPerPage}
      setCurrentPage={setCurrentPage}
      setPageSize={setItemsPerPage}
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
      toolbarActions={
        <a href={`/api/1/organizations/${orgId}/catalog`} download>
          <Button
            variant="primary"
            appearance="outline"
            hasIcon
            leadingIcon="agora-line-download"
            leadingIconHover="agora-solid-download"
          >
            {t("admin-datasets:list.catalogDownload")}
          </Button>
        </a>
      }
      emptyState={
        <AdminEmptyState
          noResults={pageContent.orgNoResults}
          createUrl="/admin/datasets/new"
        />
      }
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
