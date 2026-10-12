"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@ama-pt/agora-design-system";
import { StatusFilterSelect } from "@/components/admin/StatusFilterSelect";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import { buildApiSortParam, paginateItems } from "@/utils/admin-lists/listHelpers";
import { fetchAdminDatasets } from "@/service/api/datasets";
import { Dataset } from "@/service/types/dataset";
import type { DatasetFilters } from "@/service/types/dataset";
import { useCsvExport } from "@/hooks/admin-lists/useCsvExport";
import { useAuth } from "@/context/AuthContext";
import { SortOrder, useSortControls } from "@/hooks/admin-lists/useClientTableState";
import { useDebouncedSearch } from "@/hooks/admin-lists/useDebouncedSearch";
import {
  createDatasetColumns,
  DatasetSortField,
  sortDatasets,
  systemDatasetSortFieldMap,
} from "@/components/admin/datasets/config/datasetsListConfig";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import type { BoDatasetsPage } from "@/service/types/admin/datasets";
import Image from "next/image";

interface DatasetsClientProps {
  pageContent: BoDatasetsPage;
}

export default function DatasetsClient({ pageContent }: DatasetsClientProps) {
  const { t } = useTranslation(["admin-common", "admin-datasets"]);
  const downloadListCsv = useCsvExport();
  const { user, isLoading: isUserLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<DatasetSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get("status") ?? "");
  const usesLocalSort = sortField === "status" || sortField === "resources" || sortField === "quality";

  const sortParam = useMemo(
    () => (usesLocalSort ? undefined : buildApiSortParam(sortField, sortOrder, systemDatasetSortFieldMap)),
    [sortField, sortOrder, usesLocalSort],
  );

  const filters = useMemo<DatasetFilters>(() => {
    const statusFilters: { private?: boolean; archived?: boolean; deleted?: boolean } = {};
    if (statusFilter === "public") {
      statusFilters.private = false;
      statusFilters.archived = false;
      statusFilters.deleted = false;
    } else if (statusFilter === "draft") {
      statusFilters.private = true;
      statusFilters.archived = false;
      statusFilters.deleted = false;
    } else if (statusFilter === "archived") {
      statusFilters.archived = true;
      statusFilters.deleted = false;
    } else if (statusFilter === "deleted") {
      statusFilters.deleted = true;
    }

    return {
      owner: user?.id,
      q: searchQuery.trim() || undefined,
      sort: sortParam,
      ...statusFilters,
    };
  }, [searchQuery, sortParam, statusFilter, user?.id]);

  const loadDatasets = useCallback(async () => {
    if (isUserLoading) return;
    if (!user?.id) {
      setDatasets([]);
      setTotalItems(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // File count, status, and quality have no backend sort parameter.
      // Sort them locally and fetch all items to ensure we have the full dataset for sorting.
      const response = await fetchAdminDatasets(
        usesLocalSort ? 1 : currentPage,
        usesLocalSort ? 9999 : pageSize,
        filters,
      );
      setDatasets(response.data || []);
      setTotalItems(response.total || 0);
    } catch (error) {
      console.error("Error loading datasets:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filters, isUserLoading, pageSize, user?.id, usesLocalSort]);

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
  const visibleDatasets = useMemo(
    () =>
      usesLocalSort
        ? paginateItems(sortDatasets(datasets, sortField, sortOrder), currentPage, pageSize)
        : datasets,
    [currentPage, datasets, pageSize, sortField, sortOrder, usesLocalSort],
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
        statusLabels: {
          public: t("admin-common:status.public"),
          draft: t("admin-common:status.draft"),
          archived: t("admin-common:status.archived"),
          deleted: t("admin-common:status.deleted"),
        },
      }),
    [t],
  );

  // One request with page_size = the total the table already received.
  const handleDownloadCsv = useCallback(async () => {
    const response = await fetchAdminDatasets(1, totalItems, filters);
    const allDatasets = response.data ?? [];
    // The fetchers return an empty page on error.
    if (totalItems > 0 && allDatasets.length === 0) {
      throw new Error(t("admin-common:csvExport.fetchError"));
    }
    const rows = usesLocalSort ? sortDatasets(allDatasets, sortField, sortOrder) : allDatasets;
    downloadListCsv(t("admin-datasets:list.myListTitle"), rows, columns);
  }, [downloadListCsv, columns, filters, sortField, sortOrder, t, totalItems, usesLocalSort]);

  const { handleSort, getSortOrder } = useSortControls(
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    setCurrentPage,
  );

  return (
    <AdminListPage
      breadcrumbItems={[{ label: t("admin-datasets:list.title") }]}
      title={t("admin-datasets:list.heroTitle")}
      kicker={t("admin-datasets:list.kicker")}
      description={t("admin-datasets:list.heroDescription")}
      listTitle={t("admin-datasets:list.myListTitle")}
      resultsCount={null}
      headerAction={
        <Button
          variant="primary"
          hasIcon
          leadingIcon="agora-line-plus-circle"
          leadingIconHover="agora-solid-plus-circle"
          onClick={() => router.push("/admin/datasets/new")}
        >
          {t("admin-datasets:list.create")}
        </Button>
      }
      isLoading={isLoading}
      count={totalItems}
      hasItems={visibleDatasets.length > 0}
      hasActiveFilters={statusFilter !== ""}
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
          defaultValue={statusFilter || undefined}
          onChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
        />
      }
      emptyState={
        <AdminEmptyState
          illustration={<Image src="/emoji-empty.svg" alt="" width={280} height={143} />}
          title={
            <div className="title">
              {t("admin-datasets:list.emptyTitlePrefix")}{" "}
              <b className="font-bold">{t("admin-datasets:list.emptyTitleHighlight")}</b>
            </div>
          }
          subtitle={t("admin-datasets:list.emptySubtitle")}
          description={t("admin-datasets:list.emptyDescription")}
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
