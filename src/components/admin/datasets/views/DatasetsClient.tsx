"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button, StatusCard } from "@ama-pt/agora-design-system";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import { StatusFilterSelect } from "@/components/admin/StatusFilterSelect";
import { buildApiSortParam, paginateItems } from "@/utils/admin-lists/listHelpers";
import { fetchAdminDatasets, fetchDatasets } from "@/service/api/datasets";
import { fetchOrgDatasets } from "@/service/api/organizations";
import { Dataset } from "@/service/types/dataset";
import type { DatasetFilters } from "@/service/types/dataset";
import { useAuth } from "@/context/AuthContext";
import { SortOrder, useSortControls } from "@/hooks/admin-lists/useClientTableState";
import { useDebouncedSearch } from "@/hooks/admin-lists/useDebouncedSearch";
import { useCsvExport } from "@/hooks/admin-lists/useCsvExport";
import {
  createAdminDatasetColumns,
  type AdminDatasetSortField,
  sortAdminDatasets,
  adminDatasetSortFieldMap,
} from "@/components/admin/datasets/config/adminDatasetsListConfig";
import { localizeHref } from "@/utils/localizeHref";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import type { BoDatasetsPage } from "@/service/types/admin/datasets";
import Image from "next/image";
import { can } from "@/utils/permissions";
import styles from "./datasetsList.module.css";

type DatasetsClientProps = {
  pageContent: BoDatasetsPage;
} & (
  | { scope?: "personal"; orgId?: never }
  | { scope: "organization"; orgId: string }
  | { scope: "system"; orgId?: never }
);

export default function DatasetsClient({
  pageContent,
  scope = "personal",
  orgId,
}: DatasetsClientProps) {
  const { t, i18n } = useTranslation(["admin-common", "admin-datasets"]);
  const downloadListCsv = useCsvExport();
  const { user, hasOrganization, isLoading: isUserLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const createHref =
    scope === "organization"
      ? `/admin/org/${orgId}/datasets/new`
      : scope === "system"
        ? "/admin/datasets/new"
        : "/admin/me/datasets/new";
  const listTitleKey =
    scope === "organization"
      ? "orgListTitle"
      : scope === "system"
        ? "systemListTitle"
        : "myListTitle";
  const emptySubtitleKey =
    scope === "organization"
      ? "orgEmptySubtitle"
      : scope === "system"
        ? "systemEmptySubtitle"
        : "emptySubtitle";

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<AdminDatasetSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get("status") ?? "");
  const usesLocalSort = sortField === "producer" || sortField === "quality";
  const sortsAllPersonalDatasets = scope === "personal" && usesLocalSort;

  const sortParam = useMemo(
    () =>
      usesLocalSort ? undefined : buildApiSortParam(sortField, sortOrder, adminDatasetSortFieldMap),
    [sortField, sortOrder, usesLocalSort]
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
      ...(scope === "personal" ? { owner: user?.id } : {}),
      q: searchQuery.trim() || undefined,
      sort: sortParam,
      ...statusFilters,
    };
  }, [scope, searchQuery, sortParam, statusFilter, user?.id]);

  const fetchDatasetPage = useCallback(
    async (page: number, size: number) => {
      const response =
        scope === "organization"
          ? await fetchOrgDatasets(orgId!, page, size, filters)
          : await fetchAdminDatasets(page, size, filters);
      return scope === "system" && response.total === 0 && !searchQuery.trim() && !statusFilter
        ? fetchDatasets(page, size, filters)
        : response;
    },
    [filters, orgId, scope, searchQuery, statusFilter]
  );

  const loadDatasets = useCallback(
    async (isCancelled: () => boolean) => {
      if (isUserLoading) return;
      if (!user?.id) {
        setDatasets([]);
        setTotalItems(0);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Preserve each scope's pagination: personal local sorting fetches its
        // records together; organization and system lists fetch one page.
        const requestedPage = sortsAllPersonalDatasets ? 1 : currentPage;
        const requestedPageSize = sortsAllPersonalDatasets ? 9999 : pageSize;
        const result = await fetchDatasetPage(requestedPage, requestedPageSize);
        if (!isCancelled()) {
          setDatasets(result.data || []);
          setTotalItems(result.total || 0);
        }
      } catch (error) {
        console.error("Error loading datasets:", error);
      } finally {
        if (!isCancelled()) setIsLoading(false);
      }
    },
    [currentPage, fetchDatasetPage, isUserLoading, pageSize, user?.id, sortsAllPersonalDatasets]
  );

  useEffect(() => {
    let isCancelled = false;

    queueMicrotask(() => {
      if (!isCancelled) void loadDatasets(() => isCancelled);
    });

    return () => {
      isCancelled = true;
    };
  }, [loadDatasets]);

  const handleSearch = useDebouncedSearch((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  });
  const visibleDatasets = useMemo(() => {
    if (!usesLocalSort) return datasets;
    const sorted = sortAdminDatasets(datasets, sortField, sortOrder);
    return sortsAllPersonalDatasets ? paginateItems(sorted, currentPage, pageSize) : sorted;
  }, [
    currentPage,
    datasets,
    pageSize,
    sortField,
    sortOrder,
    usesLocalSort,
    sortsAllPersonalDatasets,
  ]);
  const columns = useMemo(
    () =>
      createAdminDatasetColumns({
        editHref: (dataset) => {
          if (scope === "personal") return `/admin/me/datasets/edit?id=${dataset.id}`;
          if (!can(dataset, "edit")) return `/datasets/${dataset.slug}`;
          return scope === "organization"
            ? `/admin/org/${orgId}/datasets/edit?slug=${dataset.slug}`
            : `/admin/datasets/${dataset.id}`;
        },
        labels: {
          title: t("admin-datasets:list.columns.titleShort"),
          status: t("admin-datasets:list.columns.status"),
          producer: t("admin-datasets:list.columns.producer"),
          lastModified: t("admin-datasets:list.columns.lastChanged"),
          quality: t("admin-datasets:list.columns.metadataQuality"),
        },
        statusLabels: {
          public: t("admin-datasets:list.published"),
          draft: t("admin-common:status.draft"),
          archived: t("admin-common:status.archived"),
          deleted: t("admin-common:status.deleted"),
        },
      }),
    [orgId, scope, t]
  );

  const handleDownloadCsv = useCallback(async () => {
    const response = await fetchDatasetPage(1, totalItems);
    const allDatasets = response.data ?? [];
    if (totalItems > 0 && allDatasets.length === 0) {
      throw new Error(t("admin-common:csvExport.fetchError"));
    }
    const rows = usesLocalSort ? sortAdminDatasets(allDatasets, sortField, sortOrder) : allDatasets;
    downloadListCsv(t(`admin-datasets:list.${listTitleKey}`), rows, columns);
  }, [
    columns,
    downloadListCsv,
    fetchDatasetPage,
    listTitleKey,
    sortField,
    sortOrder,
    t,
    totalItems,
    usesLocalSort,
  ]);

  const { handleSort, getSortOrder } = useSortControls(
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    setCurrentPage
  );

  return (
    <AdminListPage
      className={styles.page}
      title={t("admin-datasets:list.title")}
      kicker={t("admin-datasets:list.kicker")}
      description={t("admin-datasets:list.heroDescription")}
      headerClassName="xl:items-center"
      headerInfoClassName="w-full max-w-[592px]"
      breadcrumbItems={[{ label: t("admin-datasets:list.title") }]}
      listTitle={t(`admin-datasets:list.${listTitleKey}`)}
      onDownloadCsv={handleDownloadCsv}
      beforeList={
        scope === "personal" && !isUserLoading && user && !hasOrganization ? (
          <StatusCard
            variant="outline-informative"
            showIcon
            title={t("admin-datasets:list.noOrganizationTitle")}
            description={t("admin-datasets:list.noOrganizationDescription")}
            anchorOnRightSide
            anchor={{
              href: localizeHref("/admin/organizations/new", i18n.language),
              "aria-label": t("admin-datasets:form.organizationLink"),
              hasIcon: true,
              iconOnly: true,
              trailingIcon: "agora-solid-arrow-right-circle",
              trailingIconHover: "agora-solid-arrow-right-circle",
            }}
          />
        ) : null
      }
      headerAction={
        <Button
          variant="primary"
          hasIcon
          leadingIcon="agora-line-plus-circle"
          leadingIconHover="agora-solid-plus-circle"
          onClick={() => router.push(localizeHref(createHref, i18n.language))}
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
        appearance: "bar",
        label: pageContent.search?.label,
        placeholder: pageContent.search?.placeholder ?? "",
        hint: pageContent.search?.hint,
        onChange: handleSearch,
      }}
      filters={
        <StatusFilterSelect
          value={statusFilter}
          options={[
            { value: "", label: t("admin-common:filters.all") },
            { value: "public", label: t("admin-datasets:list.filters.published") },
            { value: "draft", label: t("admin-datasets:list.filters.drafts") },
            { value: "archived", label: t("admin-datasets:list.filters.archived") },
            { value: "deleted", label: t("admin-datasets:list.filters.deleted") },
          ]}
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
          subtitle={t(`admin-datasets:list.${emptySubtitleKey}`)}
          description={t("admin-datasets:list.emptyDescription")}
        />
      }
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
