"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@ama-pt/agora-design-system";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import { buildApiSortParam } from "@/utils/admin-lists/listHelpers";
import { fetchOrgDatasets } from "@/service/api/organizations";
import { Dataset } from "@/service/types/dataset";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useAuth } from "@/context/AuthContext";
import { StatusFilterSelect } from "@/components/admin/StatusFilterSelect";
import { SortOrder, useSortControls } from "@/hooks/admin-lists/useClientTableState";
import { useDebouncedSearch } from "@/hooks/admin-lists/useDebouncedSearch";
import {
  createDatasetColumns,
  OrgDatasetSortField,
} from "@/components/admin/datasets/config/datasetsListConfig";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import type { BoDatasetsPage } from "@/service/types/admin/datasets";

const ORG_DATASET_SORT_MAP: Record<OrgDatasetSortField, string> = {
  title: "title",
  created: "created",
  last_update: "last_update",
};

interface OrgDatasetsClientProps {
  orgId: string;
  pageContent: BoDatasetsPage;
}

export default function OrgDatasetsClient({ orgId, pageContent }: OrgDatasetsClientProps) {
  const { t } = useTranslation(["admin-common", "admin-datasets"]);
  const { user } = useAuth();
  const orgName = useViewedOrganizationName(orgId, user?.organizations);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState<OrgDatasetSortField | null>("created");
  const [sortOrder, setSortOrder] = useState<SortOrder>("descending");

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
      }),
    [orgId, t],
  );

  const loadDatasets = useCallback(
    async (page: number, pageSize: number, q: string, status: string, sort?: string) => {
      setIsLoading(true);
      try {
        const filters: {
          q?: string;
          sort?: string;
          private?: boolean;
          archived?: boolean;
          deleted?: boolean;
        } = {};

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
    const sort = buildApiSortParam(sortField, sortOrder, ORG_DATASET_SORT_MAP);

    const loadCurrentDatasets = async () => {
      if (isCancelled) return;
      await loadDatasets(currentPage, itemsPerPage, searchQuery, statusFilter, sort);
    };

    void loadCurrentDatasets();

    return () => {
      isCancelled = true;
    };
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
    setCurrentPage,
  );

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: t("admin-common:breadcrumbs.administration"), url: "/admin" },
        { label: orgName || t("admin-common:breadcrumbs.organization"), url: "#" },
        { label: t("admin-datasets:list.title"), url: "#" },
      ]}
      title={t("admin-datasets:list.title")}
      isLoading={isLoading}
      count={total}
      hasItems={datasets.length > 0}
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
