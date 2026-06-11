"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import { paginateItems } from "@/components/admin/lists/listHelpers";
import { useAdminListController } from "@/components/admin/lists/useAdminListController";
import { fetchOrgHarvesters } from "@/services/api";
import type { HarvestSource } from "@/types/api";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useAuth } from "@/context/AuthContext";
import AdminEmptyState from "../AdminEmptyState";
import StatusFilterSelect from "../StatusFilterSelect";
import {
  createOrgHarvesterColumns,
  filterHarvestersByStatus,
  sortHarvesters,
  type HarvesterSortField,
} from "./harvestersListConfig";

export default function OrgHarvestersClient() {
  const params = useParams();
  const orgIdFromUrl = params?.orgId as string | undefined;
  const { activeOrg, isLoading: isOrgLoading, selectOrganization } = useActiveOrganization();
  const orgId = orgIdFromUrl || activeOrg?.id;
  const { user } = useAuth();
  const orgName = useViewedOrganizationName(orgId, user?.organizations);

  const [harvesters, setHarvesters] = useState<HarvestSource[]>([]);
  const [isLoading, setIsLoading] = useState(() => !!orgId);
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    sortField,
    sortOrder,
    handleSort,
    getSortOrder,
    filters,
    updateFilter,
  } = useAdminListController<HarvesterSortField, { statusFilter: string }>({
    initialFilters: { statusFilter: "" },
  });

  useEffect(() => {
    if (orgIdFromUrl && activeOrg?.id !== orgIdFromUrl) {
      selectOrganization(orgIdFromUrl);
    }
  }, [orgIdFromUrl, activeOrg?.id, selectOrganization]);

  useEffect(() => {
    if (!orgId) {
      return;
    }
    const resolvedOrgId = orgId;

    async function loadHarvesters() {
      setIsLoading(true);
      try {
        const response = await fetchOrgHarvesters(resolvedOrgId, 1, 9999);
        setHarvesters(response.data || []);
      } catch (error) {
        console.error("Error loading org harvesters:", error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadHarvesters();
  }, [orgId]);

  const filteredHarvesters = useMemo(
    () => filterHarvestersByStatus(harvesters, filters.statusFilter),
    [harvesters, filters.statusFilter]
  );

  const sortedHarvesters = useMemo(
    () => sortHarvesters(filteredHarvesters, sortField, sortOrder),
    [filteredHarvesters, sortField, sortOrder]
  );

  const paginatedHarvesters = useMemo(
    () => paginateItems(sortedHarvesters, currentPage, pageSize),
    [sortedHarvesters, currentPage, pageSize]
  );

  const columns = useMemo(
    () =>
      createOrgHarvesterColumns({
        editHref: (harvester) => `/pages/admin/org/harvesters/${harvester.id}`,
      }),
    []
  );

  if (!isOrgLoading && !orgId) {
    return (
      <AdminEmptyState
        icon="agora-line-buildings"
        title="Sem organizações"
        description="Não pertence a nenhuma organização."
      />
    );
  }

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: orgName || "Organização", url: "#" },
        { label: "Harvesters", url: "/pages/admin/org/harvesters" },
      ]}
      title="Harvesters"
      isLoading={isLoading}
      count={filteredHarvesters.length}
      currentPage={currentPage}
      pageSize={pageSize}
      setCurrentPage={setCurrentPage}
      search={{
        placeholder: "Pesquise o nome do harvester",
        ariaLabel: "Pesquisar harvesters",
      }}
      filters={
        <StatusFilterSelect
          value={filters.statusFilter}
          onChange={(value) => updateFilter("statusFilter", value)}
        />
      }
      emptyState={
        <AdminEmptyState
          icon="agora-line-buildings"
          title="Sem harvesters"
          description="A organização ainda não tem harvesters."
        />
      }
    >
      <AdminListTable
        items={paginatedHarvesters}
        columns={columns}
        getSortOrder={getSortOrder}
        handleSort={handleSort}
        getRowKey={(harvester) => harvester.id}
      />
    </AdminListPage>
  );
}
