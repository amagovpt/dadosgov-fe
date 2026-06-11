"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, CardNoResults, Icon, usePopupContext } from "@ama-pt/agora-design-system";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import { useAdminListController } from "@/components/admin/lists/useAdminListController";
import { fetchOrganizations, deleteOrganization } from "@/services/api";
import type { Organization } from "@/types/api";
import {
  createOrganizationColumns,
  organizationSortFieldMap,
  type OrganizationSortField,
} from "./organizationsListConfig";

function DeleteOrgPopupContent({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="flex flex-col gap-16">
      <p>Esta ação é irreversível.</p>
      <div className="flex justify-end gap-16 pt-16">
        <Button appearance="outline" variant="neutral" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          hasIcon
          leadingIcon="agora-line-trash"
          leadingIconHover="agora-solid-trash"
        >
          Eliminar
        </Button>
      </div>
    </div>
  );
}

export default function SystemOrganizationsClient() {
  const { show, hide } = usePopupContext();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingOrgId, setDeletingOrgId] = useState<string | null>(null);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    searchQuery,
    handleSearch,
    sortParam,
    getSortOrder,
    handleSort,
  } = useAdminListController<OrganizationSortField>({
    initialFilters: {},
    sortFieldMap: organizationSortFieldMap,
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchOrganizations(currentPage, pageSize, {
        q: searchQuery.trim() || undefined,
        sort: sortParam,
      });
      setOrganizations(response.data || []);
      setTotalItems(response.total || 0);
    } catch (error) {
      console.error("Error loading organizations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, sortParam]);

  const handleDeleteOrg = useCallback(
    (organization: Organization) => {
      show(
        <DeleteOrgPopupContent
          onClose={hide}
          onConfirm={async () => {
            setDeletingOrgId(organization.id);
            try {
              await deleteOrganization(organization.id);
              hide();
              await loadData();
            } catch (error) {
              console.error("Error deleting organization:", error);
              hide();
            } finally {
              setDeletingOrgId(null);
            }
          }}
        />,
        {
          title: "Tem a certeza que quer eliminar esta organização?",
          closeAriaLabel: "Fechar",
          dimensions: "m",
        }
      );
    },
    [hide, loadData, show]
  );

  const columns = useMemo(
    () =>
      createOrganizationColumns({
        deletingOrgId,
        onDelete: handleDeleteOrg,
      }),
    [deletingOrgId, handleDeleteOrg]
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: "Sistema", url: "#" },
        { label: "Organizações", url: "/pages/admin/system/organizations" },
      ]}
      title="Organizações"
      isLoading={isLoading}
      count={totalItems}
      hasItems={organizations.length > 0}
      currentPage={currentPage}
      pageSize={pageSize}
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
      search={{
        placeholder: "Pesquise o nome da organização",
        ariaLabel: "Pesquisar organizações",
        onChange: handleSearch,
      }}
      emptyState={
        <CardNoResults
          position="center"
          icon={<Icon name="agora-line-building" className="icon-xl h-12 w-12 text-primary-500" />}
          title="Sem organizações"
          description="Nenhuma organização encontrada."
          hasAnchor={false}
        />
      }
    >
      <AdminListTable
        items={organizations}
        columns={columns}
        getSortOrder={getSortOrder}
        handleSort={handleSort}
        getRowKey={(organization) => organization.id}
      />
    </AdminListPage>
  );
}
