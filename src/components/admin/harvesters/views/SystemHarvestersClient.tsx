"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StatusCard, usePopupContext } from "@ama-pt/agora-design-system";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import AdminSquidexEmptyState from "@/components/admin/lists/AdminSquidexEmptyState";
import { useAdminListController } from "@/hooks/admin-lists/useAdminListController";
import { fetchHarvesters, rejectHarvestSource, validateHarvestSource } from "@/service/api/harvesters";
import type { HarvestSource } from "@/service/types/harvester";
import {
  ApproveHarvesterPopupContent,
  RejectHarvesterPopupContent,
} from "@/components/admin/harvesters/form-ui/HarvesterValidationPopups";
import StatusFilterSelect from "@/components/admin/StatusFilterSelect";
import {
  createSystemHarvesterColumns,
  filterHarvestersByStatus,
} from "@/components/admin/harvesters/config/harvestersListConfig";
import type { BoHarvestersPage } from "@/service/types/admin/harvesters";

interface SystemHarvestersClientProps {
  pageContent: BoHarvestersPage;
}

export default function SystemHarvestersClient({ pageContent }: SystemHarvestersClientProps) {
  const { t } = useTranslation(["admin-common", "admin-harvesters"]);
  const [harvesters, setHarvesters] = useState<HarvestSource[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);
  const { show, hide } = usePopupContext();
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    searchQuery,
    handleSearch,
    filters,
    updateFilter,
  } = useAdminListController<never, { statusFilter: string }>({
    initialFilters: { statusFilter: "" },
  });

  const applyValidationUpdate = useCallback((updated: HarvestSource) => {
    setHarvesters((prev) =>
      prev.map((harvester) =>
        harvester.id === updated.id
          ? { ...harvester, validation: updated.validation ?? harvester.validation }
          : harvester
      )
    );
  }, []);

  const handleApprove = useCallback(
    async (harvester: HarvestSource, comment: string) => {
      const updated = await validateHarvestSource(harvester.id, comment || undefined);
      applyValidationUpdate(updated);
      hide();
      setFeedback({
        variant: "success",
        message: t("admin-harvesters:feedback.approved", { name: harvester.name }),
      });
    },
    [applyValidationUpdate, hide, t]
  );

  const handleReject = useCallback(
    async (harvester: HarvestSource, comment: string) => {
      const updated = await rejectHarvestSource(harvester.id, comment);
      applyValidationUpdate(updated);
      hide();
      setFeedback({
        variant: "success",
        message: t("admin-harvesters:feedback.rejected", { name: harvester.name }),
      });
    },
    [applyValidationUpdate, hide, t]
  );

  const openApprovePopup = useCallback(
    (harvester: HarvestSource) => {
      show(
        <ApproveHarvesterPopupContent
          harvester={harvester}
          onClose={hide}
          onConfirm={(comment) => handleApprove(harvester, comment)}
        />,
        {
          title: t("admin-harvesters:validation.popup.approveTitle"),
          closeAriaLabel: t("admin-harvesters:validation.popup.closeAriaLabel"),
          dimensions: "m",
        }
      );
    },
    [show, hide, handleApprove, t]
  );

  const openRejectPopup = useCallback(
    (harvester: HarvestSource) => {
      show(
        <RejectHarvesterPopupContent
          harvester={harvester}
          onClose={hide}
          onConfirm={(comment) => handleReject(harvester, comment)}
        />,
        {
          title: t("admin-harvesters:validation.popup.rejectTitle"),
          closeAriaLabel: t("admin-harvesters:validation.popup.closeAriaLabel"),
          dimensions: "m",
        }
      );
    },
    [show, hide, handleReject, t]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      setIsLoading(true);
      setCurrentPage(page);
    },
    [setCurrentPage]
  );

  const handlePageSizeChange = useCallback(
    (nextPageSize: number) => {
      setIsLoading(true);
      setPageSize(nextPageSize);
    },
    [setPageSize]
  );

  useEffect(() => {
    let isActive = true;

    const run = async () => {
      try {
        const response = await fetchHarvesters(currentPage, pageSize);
        if (!isActive) return;
        setHarvesters(response.data || []);
        setTotalItems(response.total || 0);
      } catch (error) {
        if (!isActive) return;
        console.error("Error loading harvesters:", error);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void run();

    return () => {
      isActive = false;
    };
  }, [currentPage, pageSize]);

  const filteredHarvesters = useMemo(() => {
    let result = harvesters;
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter((harvester) => harvester.name.toLowerCase().includes(query));
    }
    return filterHarvestersByStatus(result, filters.statusFilter);
  }, [harvesters, searchQuery, filters.statusFilter]);

  const columns = useMemo(
    () =>
      createSystemHarvesterColumns({
        onApprove: openApprovePopup,
        onReject: openRejectPopup,
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
        actions: {
          approveHarvester: t("admin-harvesters:actions.approveHarvester"),
          rejectHarvester: t("admin-harvesters:actions.rejectHarvester"),
          approveHarvesterNamed: (name) =>
            t("admin-harvesters:actions.approveHarvesterNamed", { name }),
          rejectHarvesterNamed: (name) =>
            t("admin-harvesters:actions.rejectHarvesterNamed", { name }),
        },
      }),
    [openApprovePopup, openRejectPopup, t]
  );

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: t("admin-common:breadcrumbs.administration"), url: "/admin" },
        { label: t("admin-common:breadcrumbs.system"), url: "#" },
        { label: t("admin-harvesters:title"), url: "/admin/system/harvesters" },
      ]}
      title={t("admin-harvesters:title")}
      isLoading={isLoading}
      count={totalItems}
      hasItems={filteredHarvesters.length > 0}
      currentPage={currentPage}
      pageSize={pageSize}
      setCurrentPage={handlePageChange}
      setPageSize={handlePageSizeChange}
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
          options={[
            { value: "", label: t("admin-harvesters:filters.options.all") },
            { value: "pending", label: t("admin-harvesters:filters.options.pending") },
            { value: "accepted", label: t("admin-harvesters:filters.options.accepted") },
            { value: "refused", label: t("admin-harvesters:filters.options.refused") },
            { value: "done", label: t("admin-harvesters:filters.options.done") },
            { value: "failed", label: t("admin-harvesters:filters.options.failed") },
          ]}
        />
      }
      feedback={
        feedback ? (
          <div className="mb-[24px]">
            <StatusCard variant={feedback.variant} showIcon description={feedback.message} />
          </div>
        ) : undefined
      }
      emptyState={<AdminSquidexEmptyState noResults={pageContent.systemNoResults} />}
    >
      <AdminListTable
        items={filteredHarvesters}
        columns={columns}
        getRowKey={(harvester) => harvester.id}
      />
    </AdminListPage>
  );
}

