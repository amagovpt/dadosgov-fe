"use client";

import { useEffect, useMemo, useState } from "react";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import { paginateItems } from "@/utils/admin-lists/listHelpers";
import { fetchMyCommunityResources } from "@/service/api/community-resources";
import { CommunityResource } from "@/service/types/community-resource";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { SortOrder, useSortControls } from "@/hooks/admin-lists/useClientTableState";
import {
  CommunityResourceSortField,
  createCommunityResourceColumns,
  sortCommunityResources,
} from "./communityResourcesListConfig";
import AdminEmptyState from "../AdminEmptyState";

export default function CommunityResourcesClient() {
  const { displayName } = useCurrentUser();

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
        editHref: (resource) => `/pages/admin/me/community-resources/edit?id=${resource.id}`,
      }),
    []
  );

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: displayName || "...", url: "#" },
        { label: "Recursos comunitários", url: "/pages/admin/me/community-resources" },
      ]}
      title="Recursos comunitários"
      isLoading={isLoading}
      count={sortedResources.length}
      currentPage={currentPage}
      pageSize={pageSize}
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
      search={{
        placeholder: "Pesquisar recursos comunitários",
        ariaLabel: "Pesquisar recursos comunitários",
        onChange: (value) => {
          setSearchQuery(value);
          setCurrentPage(1);
        },
      }}
      emptyState={
        <AdminEmptyState
          icon="agora-line-user-group"
          description="Ainda não publicou um recurso comunitário."
          createUrl="/pages/admin/community-resources/new"
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

