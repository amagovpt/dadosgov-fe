"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import { paginateItems } from "@/utils/admin-lists/listHelpers";
import { useAdminListController } from "@/hooks/admin-lists/useAdminListController";
import { fetchOrgHarvesters } from "@/service/api/harvesters";
import type { HarvestSource } from "@/service/types/harvester";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useAuth } from "@/context/AuthContext";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import StatusFilterSelect from "@/components/admin/StatusFilterSelect";
import {
  createOrgHarvesterColumns,
  filterHarvestersByStatus,
  HARVESTERS_FETCH_PAGE_SIZE,
  sortHarvesters,
  type HarvesterSortField,
} from "@/components/admin/harvesters/config/harvestersListConfig";
import type { BoHarvestersPage } from "@/service/types/admin/harvesters";

interface OrgHarvestersClientProps {
  orgId?: string;
  pageContent: BoHarvestersPage;
}

export default function OrgHarvestersClient({ pageContent }: OrgHarvestersClientProps) {
  const { t } = useTranslation(["admin-common", "admin-harvesters"]);
  const params = useParams();
  const orgIdFromUrl = params?.orgId as string | undefined;
  const { activeOrg, isLoading: isOrgLoading, selectOrganization } = useActiveOrganization();
  const orgId = orgIdFromUrl || activeOrg?.id;
  const { user } = useAuth();
  const orgName = useViewedOrganizationName(orgId, user?.organizations);

  const [harvesters, setHarvesters] = useState<HarvestSource[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(() => !!orgId);
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    searchQuery,
    handleSearch,
    sortField,
    sortOrder,
    handleSort,
    getSortOrder,
    filters,
    updateFilter,
  } = useAdminListController<HarvesterSortField, { statusFilter: string }>({
    initialFilters: { statusFilter: "" },
  });
  const usesLocalFallback = Boolean(filters.statusFilter) || Boolean(sortField);

  useEffect(() => {
    if (orgIdFromUrl && activeOrg?.id !== orgIdFromUrl) {
      selectOrganization(orgIdFromUrl);
    }
  }, [orgIdFromUrl, activeOrg?.id, selectOrganization]);

  const loadHarvesters = useCallback(async () => {
    if (!orgId) {
      setHarvesters([]);
      setTotalItems(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetchOrgHarvesters(
        orgId,
        usesLocalFallback ? 1 : currentPage,
        usesLocalFallback ? HARVESTERS_FETCH_PAGE_SIZE : pageSize,
        { q: searchQuery.trim() || undefined },
      );
      setHarvesters(response.data || []);
      setTotalItems(response.total || 0);
    } catch (error) {
      console.error("Error loading org harvesters:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, orgId, pageSize, searchQuery, usesLocalFallback]);

  useEffect(() => {
    let isCancelled = false;
    const loadCurrentHarvesters = async () => {
      if (isCancelled) return;
      await loadHarvesters();
    };
    void loadCurrentHarvesters();
    return () => {
      isCancelled = true;
    };
  }, [loadHarvesters]);

  const filteredHarvesters = useMemo(
    () =>
      filterHarvestersByStatus(harvesters, filters.statusFilter),
    [harvesters, filters.statusFilter]
  );

  const sortedHarvesters = useMemo(
    () => sortHarvesters(filteredHarvesters, sortField, sortOrder),
    [filteredHarvesters, sortField, sortOrder]
  );

  const paginatedHarvesters = useMemo(
    () => (usesLocalFallback ? paginateItems(sortedHarvesters, currentPage, pageSize) : sortedHarvesters),
    [currentPage, pageSize, sortedHarvesters, usesLocalFallback]
  );

  const columns = useMemo(
    () =>
      createOrgHarvesterColumns({
        editHref: (harvester) => `/admin/org/${orgId}/harvesters/${harvester.id}`,
        labels: {
          name: t("admin-harvesters:columns.name"),
          status: t("admin-harvesters:columns.status"),
          implementation: t("admin-harvesters:columns.implementation"),
          createdAt: t("admin-harvesters:columns.createdAt"),
          lastJob: t("admin-harvesters:columns.lastJob"),
          datasets: t("admin-harvesters:columns.datasets"),
          api: t("admin-harvesters:columns.api"),
          actions: t("admin-harvesters:columns.actions"),
          notYet: t("admin-harvesters:columns.notYet"),
        },
        statusLabels: {
          pendingValidation: t("admin-harvesters:status.pendingValidation"),
          accepted: t("admin-harvesters:status.accepted"),
          refused: t("admin-harvesters:status.refused"),
          pending: t("admin-harvesters:status.pending"),
          initializing: t("admin-harvesters:status.initializing"),
          initialized: t("admin-harvesters:status.initialized"),
          processing: t("admin-harvesters:status.processing"),
          done: t("admin-harvesters:status.done"),
          doneErrors: t("admin-harvesters:status.doneErrors"),
          failed: t("admin-harvesters:status.failed"),
          started: t("admin-harvesters:status.started"),
          noCurrentJob: t("admin-harvesters:status.noCurrentJob"),
          noExecution: t("admin-harvesters:status.noExecution"),
        },
      }),
    [orgId, t]
  );

  if (!isOrgLoading && !orgId) {
    return (
      <AdminEmptyState
        icon="agora-line-buildings"
        title={t("admin-harvesters:empty.noOrganizationsTitle")}
        description={t("admin-harvesters:empty.noOrganizationsDescription")}
      />
    );
  }

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: t("admin-common:breadcrumbs.administration"), url: "/admin" },
        { label: orgName || t("admin-common:breadcrumbs.organization"), url: "#" },
        { label: t("admin-harvesters:title"), url: `/admin/org/${orgId}/harvesters` },
      ]}
      title={t("admin-harvesters:title")}
      isLoading={isLoading}
      count={usesLocalFallback ? filteredHarvesters.length : totalItems}
      hasItems={paginatedHarvesters.length > 0}
      currentPage={currentPage}
      pageSize={pageSize}
      setCurrentPage={setCurrentPage}
      search={{
        label: pageContent.search?.label,
        placeholder: pageContent.search?.placeholder ?? "",
        hint: pageContent.search?.hint,
        onChange: handleSearch,
      }}
      filters={
        <StatusFilterSelect
          value={filters.statusFilter}
          onChange={(value) => updateFilter("statusFilter", value)}
        />
      }
      emptyState={
        <AdminEmptyState noResults={pageContent.orgNoResults} />
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
