"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import { buildApiSortParam, paginateItems } from "@/utils/admin-lists/listHelpers";
import { fetchOrgCommunityResources } from "@/service/api/community-resources";
import { CommunityResource } from "@/service/types/community-resource";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useAuth } from "@/context/AuthContext";
import { SortOrder, useSortControls } from "@/hooks/admin-lists/useClientTableState";
import {
  createCommunityResourceColumns,
  OrgCommunityResourceSortField,
  sortCommunityResources,
} from "@/components/admin/community-resources/config/communityResourcesListConfig";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import type { BoCommunityResourcesPage } from "@/service/types/admin/community-resources";

interface OrgCommunityResourcesClientProps {
  orgId?: string;
  pageContent: BoCommunityResourcesPage;
}

export default function OrgCommunityResourcesClient({ pageContent }: OrgCommunityResourcesClientProps) {
  const { t } = useTranslation(["admin-common", "admin-community-resources"]);
  const params = useParams();
  const routeOrgId = params?.orgId as string | undefined;
  const { activeOrg, isLoading: isOrgLoading } = useActiveOrganization();
  const resolvedOrgId = routeOrgId || activeOrg?.id;
  const { user } = useAuth();
  const orgName = useViewedOrganizationName(resolvedOrgId, user?.organizations);

  const [resources, setResources] = useState<CommunityResource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<OrgCommunityResourceSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");
  const usesLocalFallback = sortField === "status" || sortField === "created_at" || sortField === "last_modified";
  const sortParam = useMemo(
    () => buildApiSortParam(sortField, sortOrder, { title: "title", status: null, created_at: null, last_modified: null }),
    [sortField, sortOrder],
  );
  const [totalItems, setTotalItems] = useState(0);

  const { handleSort, getSortOrder } = useSortControls(
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    setCurrentPage
  );

  const loadResources = useCallback(async () => {
    if (!resolvedOrgId) {
      setResources([]);
      setTotalItems(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetchOrgCommunityResources(
        resolvedOrgId,
        usesLocalFallback ? 1 : currentPage,
        usesLocalFallback ? 9999 : itemsPerPage,
        { sort: sortParam },
      );
      setResources(response.data || []);
      setTotalItems(response.total || 0);
    } catch (error) {
      console.error("Error loading org community resources:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, resolvedOrgId, sortParam, usesLocalFallback]);

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

  const sortedResources = useMemo(
    () => sortCommunityResources(resources, sortField, sortOrder),
    [resources, sortField, sortOrder]
  );
  const paginatedResources = useMemo(
    () => (usesLocalFallback ? paginateItems(sortedResources, currentPage, itemsPerPage) : sortedResources),
    [usesLocalFallback, sortedResources, currentPage, itemsPerPage]
  );
  const columns = useMemo(
    () =>
      createCommunityResourceColumns({
        titleCellStyle: "primary",
        showOwnerOnLastModified: true,
        titleHeader: t("admin-community-resources:columns.title"),
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
        editHref: (resource) => `/admin/community-resources/edit?resource_id=${resource.id}`,
      }),
    [t]
  );

  if (!isOrgLoading && !resolvedOrgId) {
    return (
      <AdminEmptyState
        icon="agora-line-buildings"
        description={t("admin-community-resources:empty.noOrganization")}
      />
    );
  }

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: t("admin-common:breadcrumbs.administration"), url: "/admin" },
        { label: orgName || t("admin-common:breadcrumbs.organization"), url: "#" },
        { label: t("admin-community-resources:title") },
      ]}
      title={t("admin-community-resources:title")}
      isLoading={isLoading}
      count={usesLocalFallback ? resources.length : totalItems}
      hasItems={paginatedResources.length > 0}
      currentPage={currentPage}
      pageSize={itemsPerPage}
      setCurrentPage={setCurrentPage}
      setPageSize={setItemsPerPage}
      search={{
        label: pageContent.search?.label,
        placeholder: pageContent.search?.placeholder ?? "",
        hint: pageContent.search?.hint,
      }}
      emptyState={
        <AdminEmptyState noResults={pageContent.orgNoResults} />
      }
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
