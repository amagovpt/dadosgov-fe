"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import { buildApiSortParam, paginateItems } from "@/utils/admin-lists/listHelpers";
import { fetchAllCommunityResources } from "@/service/api/community-resources";
import { CommunityResource } from "@/service/types/community-resource";
import CommunityResourceEditClient from "./CommunityResourceEditClient";
import {
  CommunityResourceSortField,
  createCommunityResourceColumns,
  sortCommunityResources,
} from "@/components/admin/community-resources/config/communityResourcesListConfig";
import { SortOrder, useSortControls } from "@/hooks/admin-lists/useClientTableState";
import type { BoCommunityResourcesPage } from "@/service/types/admin/community-resources";

interface SystemCommunityResourcesClientProps {
  pageContent: BoCommunityResourcesPage;
}

export default function SystemCommunityResourcesClient({
  pageContent,
}: SystemCommunityResourcesClientProps) {
  const { t } = useTranslation(["admin-common", "admin-community-resources"]);
  const searchParams = useSearchParams();
  const resourceId = searchParams.get("resource_id");

  const [resources, setResources] = useState<CommunityResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<CommunityResourceSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");
  const [totalItems, setTotalItems] = useState(0);
  const usesLocalFallback = sortField === "status" || sortField === "created_at" || sortField === "last_modified";
  const sortParam = useMemo(
    () => buildApiSortParam(sortField, sortOrder, { title: "title", status: null, format: "format", created_at: null, last_modified: null }),
    [sortField, sortOrder],
  );

  const { handleSort, getSortOrder } = useSortControls(
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    setCurrentPage
  );

  const sortedResources = useMemo(
    () => sortCommunityResources(resources, sortField, sortOrder),
    [resources, sortField, sortOrder]
  );
  const paginatedResources = useMemo(
    () => (usesLocalFallback ? paginateItems(sortedResources, currentPage, pageSize) : sortedResources),
    [usesLocalFallback, sortedResources, currentPage, pageSize]
  );
  const columns = useMemo(
    () =>
      createCommunityResourceColumns({
        includeFormat: true,
        titleHeader: t("admin-community-resources:columns.resourceTitle"),
        showDatasetLink: true,
        useSystemStatusDot: true,
        labels: {
          title: t("admin-community-resources:columns.title"),
          status: t("admin-community-resources:columns.status"),
          format: t("admin-community-resources:columns.format"),
          createdAt: t("admin-community-resources:columns.createdAt"),
          modifiedAt: t("admin-community-resources:columns.modifiedAt"),
          lastModified: t("admin-community-resources:columns.lastModified"),
          action: t("admin-community-resources:columns.action"),
          actions: t("admin-community-resources:columns.actions"),
          deleted: t("admin-community-resources:status.deleted"),
          archived: t("admin-community-resources:status.archived"),
          published: t("admin-community-resources:status.published"),
        },
        editHref: (resource) => `/admin/system/community-resources?resource_id=${resource.id}`,
      }),
    [t]
  );

  const loadResources = useCallback(async () => {
    if (resourceId) {
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetchAllCommunityResources(
        usesLocalFallback ? 1 : currentPage,
        usesLocalFallback ? 9999 : pageSize,
        { sort: sortParam },
      );
      setResources(response.data || []);
      setTotalItems(response.total || 0);
    } catch (error) {
      console.error("Error loading community resources:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, resourceId, sortParam, usesLocalFallback]);

  useEffect(() => {
    let isCancelled = false;
    const loadCurrentResources = async () => {
      if (isCancelled) return;
      await loadResources();
    };
    void loadCurrentResources();
    return () => {
      isCancelled = true;
    };
  }, [loadResources]);

  if (resourceId) {
    return <CommunityResourceEditClient pageContent={pageContent} />;
  }

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: t("admin-common:breadcrumbs.administration"), url: "/admin" },
        { label: t("admin-common:breadcrumbs.system"), url: "#" },
        {
          label: t("admin-community-resources:title"),
          url: "/admin/system/community-resources",
        },
      ]}
      title={t("admin-community-resources:title")}
      isLoading={isLoading}
      count={usesLocalFallback ? resources.length : totalItems}
      hasItems={paginatedResources.length > 0}
      currentPage={currentPage}
      pageSize={pageSize}
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
      emptyState={<AdminEmptyState noResults={pageContent.systemNoResults} />}
    >
      <AdminListTable
        items={paginatedResources}
        columns={columns}
        getSortOrder={getSortOrder}
        handleSort={handleSort}
        getRowKey={(resource) => resource.id}
      />
    </AdminListPage>
  );
}
