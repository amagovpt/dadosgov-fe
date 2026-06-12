"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CardNoResults, Icon, StatusCard, usePopupContext } from "@ama-pt/agora-design-system";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import { useAdminListController } from "@/components/admin/lists/useAdminListController";
import { fetchHarvesters, rejectHarvestSource, validateHarvestSource } from "@/service/api/harvesters";
import type { HarvestSource } from "@/service/types/harvester";
import {
  ApproveHarvesterPopupContent,
  RejectHarvesterPopupContent,
} from "@/components/admin/harvesters/HarvesterValidationPopups";
import { useAuth } from "@/context/AuthContext";
import StatusFilterSelect from "../StatusFilterSelect";
import {
  createSystemHarvesterColumns,
  filterHarvestersByStatus,
} from "./harvestersListConfig";

export default function SystemHarvestersClient() {
  const [harvesters, setHarvesters] = useState<HarvestSource[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);
  const { isAdmin } = useAuth();
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
        message: `Harvester "${harvester.name}" aprovado.`,
      });
    },
    [applyValidationUpdate, hide]
  );

  const handleReject = useCallback(
    async (harvester: HarvestSource, comment: string) => {
      const updated = await rejectHarvestSource(harvester.id, comment);
      applyValidationUpdate(updated);
      hide();
      setFeedback({
        variant: "success",
        message: `Harvester "${harvester.name}" rejeitado.`,
      });
    },
    [applyValidationUpdate, hide]
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
          title: "Aprovar harvester",
          closeAriaLabel: "Fechar",
          dimensions: "m",
        }
      );
    },
    [show, hide, handleApprove]
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
          title: "Rejeitar harvester",
          closeAriaLabel: "Fechar",
          dimensions: "m",
        }
      );
    },
    [show, hide, handleReject]
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchHarvesters(currentPage, pageSize);
      setHarvesters(response.data || []);
      setTotalItems(response.total || 0);
    } catch (error) {
      console.error("Error loading harvesters:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

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
        isAdmin,
        onApprove: openApprovePopup,
        onReject: openRejectPopup,
      }),
    [isAdmin, openApprovePopup, openRejectPopup]
  );

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: "Sistema", url: "#" },
        { label: "Harvesters", url: "/pages/admin/system/harvesters" },
      ]}
      title="Harvesters"
      isLoading={isLoading}
      count={totalItems}
      hasItems={filteredHarvesters.length > 0}
      currentPage={currentPage}
      pageSize={pageSize}
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
      search={{
        placeholder: "Pesquise o nome do harvester",
        ariaLabel: "Pesquisar harvesters",
        onChange: handleSearch,
      }}
      filters={
        <StatusFilterSelect
          value={filters.statusFilter}
          onChange={(value) => updateFilter("statusFilter", value)}
          options={[
            { value: "", label: "Todos" },
            { value: "pending", label: "Em espera de validação" },
            { value: "accepted", label: "Validado" },
            { value: "refused", label: "Recusado" },
            { value: "done", label: "Terminado" },
            { value: "failed", label: "Falhado" },
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
      emptyState={
        <CardNoResults
          position="center"
          icon={<Icon name="agora-line-download" className="icon-xl h-12 w-12 text-primary-500" />}
          title="Sem harvesters"
          description="Nenhum harvester encontrado."
          hasAnchor={false}
        />
      }
    >
      <AdminListTable
        items={filteredHarvesters}
        columns={columns}
        getRowKey={(harvester) => harvester.id}
      />
    </AdminListPage>
  );
}
