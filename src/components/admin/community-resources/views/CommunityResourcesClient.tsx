"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import { paginateItems } from "@/utils/admin-lists/listHelpers";
import { fetchMyCommunityResources } from "@/service/api/community-resources";
import { CommunityResource } from "@/service/types/community-resource";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { buildUserAdminBreadcrumbItems } from "@/utils/adminBreadcrumbs";
import { SortOrder, useSortControls } from "@/hooks/admin-lists/useClientTableState";
import {
  CommunityResourceSortField,
  createCommunityResourceColumns,
  sortCommunityResources,
} from "@/components/admin/community-resources/config/communityResourcesListConfig";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import type { BoCommunityResourcesPage } from "@/service/types/admin/community-resources";

interface CommunityResourcesClientProps {
  pageContent: BoCommunityResourcesPage;
}

export default function CommunityResourcesClient({ pageContent }: CommunityResourcesClientProps) {
  const { displayName } = useCurrentUser();
  const { t } = useTranslation(["admin-common", "admin-community-resources"]);

  const [allResources, setAllResources] = useState<CommunityResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<CommunityResourceSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");
  const [searchQuery, setSearchQuery] = useState("");

  const { handleSort, getSortOrder } = useSortControls(
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    setCurrentPage
  );

  useEffect(() => {
    async function loadResources() {
      setIsLoading(true);
      try {
        const response = await fetchMyCommunityResources(1, 9999);
        setAllResources(response.data || []);
      } catch (error) {
        console.error("Error loading community resources:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadResources();
  }, []);

  const filteredResources = useMemo(() => {
    let result = allResources;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (r) => r.title.toLowerCase().includes(q) || (r.format && r.format.toLowerCase().includes(q))
      );
    }

    return result;
  }, [allResources, searchQuery]);

  const sortedResources = useMemo(
    () => sortCommunityResources(filteredResources, sortField, sortOrder),
    [filteredResources, sortField, sortOrder]
  );
  const resources = useMemo(
    () => paginateItems(sortedResources, currentPage, pageSize),
    [sortedResources, currentPage, pageSize]
  );
  const columns = useMemo(
    () =>
      createCommunityResourceColumns({
        includeFormat: true,
        showDatasetLink: true,
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
        editHref: (resource) => `/admin/me/community-resources/edit?id=${resource.id}`,
      }),
    [t]
  );

  return (
    <AdminListPage
      breadcrumbItems={buildUserAdminBreadcrumbItems({
        t,
        userLabel: displayName,
        sectionLabel: t("admin-community-resources:title"),
      })}
      title={t("admin-community-resources:title")}
      isLoading={isLoading}
      count={sortedResources.length}
      currentPage={currentPage}
      pageSize={pageSize}
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
      search={{
        label: pageContent.search?.label,
        placeholder: pageContent.search?.placeholder ?? "",
        hint: pageContent.search?.hint,
        onChange: (value) => {
          setSearchQuery(value);
          setCurrentPage(1);
        },
      }}
      emptyState={
        <AdminEmptyState
          noResults={pageContent.myNoResults}
          createUrl="/admin/community-resources/new"
        />
      }
    >
      <AdminListTable
        items={resources}
        columns={columns}
        getSortOrder={getSortOrder}
        handleSort={handleSort}
        getRowKey={(resource) => resource.id}
      />
    </AdminListPage>
  );
}

