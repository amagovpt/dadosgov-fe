"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import { paginateItems } from "@/components/admin/lists/listHelpers";
import { fetchOrgCommunityResources } from "@/service/api/community-resources";
import { CommunityResource } from "@/service/types/community-resource";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useAuth } from "@/context/AuthContext";
import { SortOrder, useSortControls } from "@/components/admin/lists/useClientTableState";
import {
  createCommunityResourceColumns,
  OrgCommunityResourceSortField,
  sortCommunityResources,
} from "./communityResourcesListConfig";
import AdminEmptyState from "../AdminEmptyState";

export default function OrgCommunityResourcesClient() {
  const params = useParams();
  const routeOrgId = params?.orgId as string | undefined;
  const { activeOrg, isLoading: isOrgLoading } = useActiveOrganization();
  const resolvedOrgId = routeOrgId || activeOrg?.id;
  const { user } = useAuth();
  const orgName = useViewedOrganizationName(resolvedOrgId, user?.organizations);

  const [resources, setResources] = useState<CommunityResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<OrgCommunityResourceSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");

  const { handleSort, getSortOrder } = useSortControls(
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    setCurrentPage
  );

  useEffect(() => {
    if (!resolvedOrgId) {
      setIsLoading(false);
      return;
    }
    async function loadResources() {
      setIsLoading(true);
      try {
        const response = await fetchOrgCommunityResources(resolvedOrgId!, 1, 9999);
        setResources(response.data || []);
      } catch (error) {
        console.error("Error loading org community resources:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadResources();
  }, [resolvedOrgId]);

  const sortedResources = useMemo(
    () => sortCommunityResources(resources, sortField, sortOrder),
    [resources, sortField, sortOrder]
  );
  const paginatedResources = useMemo(
    () => paginateItems(sortedResources, currentPage, itemsPerPage),
    [sortedResources, currentPage, itemsPerPage]
  );
  const columns = useMemo(
    () =>
      createCommunityResourceColumns({
        titleCellStyle: "primary",
        showOwnerOnLastModified: true,
        editHref: (resource) => `/pages/admin/community-resources/edit?resource_id=${resource.id}`,
      }),
    []
  );

  if (!isOrgLoading && !resolvedOrgId) {
    return (
      <AdminEmptyState
        icon="agora-line-buildings"
        description="Não pertence a nenhuma organização."
      />
    );
  }

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: orgName || "Organização", url: "#" },
        { label: "Recursos comunitários" },
      ]}
      title="Recursos comunitários"
      isLoading={isLoading}
      count={resources.length}
      currentPage={currentPage}
      pageSize={itemsPerPage}
      setCurrentPage={setCurrentPage}
      setPageSize={setItemsPerPage}
      search={{
        placeholder: "Pesquisar recursos comunitários",
        ariaLabel: "Pesquisar recursos comunitários",
      }}
      emptyState={
        <AdminEmptyState
          icon="agora-line-buildings"
          title="Sem recursos comunitários"
          description="A organização ainda não tem recursos comunitários."
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
