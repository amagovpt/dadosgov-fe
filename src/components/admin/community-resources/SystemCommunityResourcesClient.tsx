"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CardNoResults, Icon } from "@ama-pt/agora-design-system";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import { paginateItems } from "@/utils/admin-lists/listHelpers";
import { fetchAllCommunityResources } from "@/service/api/community-resources";
import { CommunityResource } from "@/service/types/community-resource";
import CommunityResourceEditClient from "./CommunityResourceEditClient";
import {
  CommunityResourceSortField,
  createCommunityResourceColumns,
  sortCommunityResources,
} from "./communityResourcesListConfig";
import { SortOrder, useSortControls } from "@/hooks/admin-lists/useClientTableState";

export default function SystemCommunityResourcesClient() {
  const searchParams = useSearchParams();
  const resourceId = searchParams.get("resource_id");

  const [resources, setResources] = useState<CommunityResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<CommunityResourceSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");

  const { handleSort, getSortOrder } = useSortControls(
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    setCurrentPage
  );

  const loadData = useCallback(async () => {
    if (resourceId) return;
    setIsLoading(true);
    try {
      const response = await fetchAllCommunityResources(1, 9999);
      setResources(response.data || []);
    } catch (error) {
      console.error("Error loading community resources:", error);
    } finally {
      setIsLoading(false);
    }
  }, [resourceId]);

  const sortedResources = useMemo(
    () => sortCommunityResources(resources, sortField, sortOrder),
    [resources, sortField, sortOrder]
  );
  const paginatedResources = useMemo(
    () => paginateItems(sortedResources, currentPage, pageSize),
    [sortedResources, currentPage, pageSize]
  );
  const columns = useMemo(
    () =>
      createCommunityResourceColumns({
        includeFormat: true,
        titleHeader: "Título do recurso",
        showDatasetLink: true,
        useSystemStatusDot: true,
        editHref: (resource) => `/pages/admin/system/community-resources?resource_id=${resource.id}`,
      }),
    []
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (resourceId) {
    return <CommunityResourceEditClient />;
  }

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: "Sistema", url: "#" },
        { label: "Recursos comunitários", url: "/pages/admin/system/community-resources" },
      ]}
      title="Recursos comunitários"
      isLoading={isLoading}
      count={resources.length}
      currentPage={currentPage}
      pageSize={pageSize}
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
      emptyState={
        <CardNoResults
          position="center"
          icon={
            <Icon name="agora-line-user-group" className="icon-xl h-12 w-12 text-primary-500" />
          }
          title="Sem recursos comunitários"
          description="Nenhum recurso comunitário encontrado."
          hasAnchor={false}
        />
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

