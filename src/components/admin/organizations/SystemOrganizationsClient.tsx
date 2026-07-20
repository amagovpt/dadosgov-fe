"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, usePopupContext } from "@ama-pt/agora-design-system";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import AdminSquidexEmptyState from "@/components/admin/lists/AdminSquidexEmptyState";
import { useAdminListController } from "@/hooks/admin-lists/useAdminListController";
import {
  createOrganizationColumns,
  organizationSortFieldMap,
  type OrganizationSortField,
} from "./organizationsListConfig";
import { fetchOrganizations, deleteOrganization } from "@/service/api/organizations";
import { Organization } from "@/service/types/identity";
import type { BoOrganizationsPage } from "@/service/types/admin/organizations";

function DeleteOrgPopupContent({
  labels,
  onClose,
  onConfirm,
}: {
  labels: {
    description: string;
    cancel: string;
    delete: string;
  };
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="flex flex-col gap-16">
      <p>{labels.description}</p>
      <div className="flex justify-end gap-16 pt-16">
        <Button appearance="outline" variant="neutral" onClick={onClose}>
          {labels.cancel}
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          hasIcon
          leadingIcon="agora-line-trash"
          leadingIconHover="agora-solid-trash"
        >
          {labels.delete}
        </Button>
      </div>
    </div>
  );
}

interface SystemOrganizationsClientProps {
  pageContent: BoOrganizationsPage;
}

export default function SystemOrganizationsClient({ pageContent }: SystemOrganizationsClientProps) {
  const { t } = useTranslation(["admin-common", "admin-organizations"]);
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
          labels={{
            description: t("admin-organizations:delete.description"),
            cancel: t("admin-common:actions.cancel"),
            delete: t("admin-common:actions.delete"),
          }}
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
          title: t("admin-organizations:delete.title"),
          closeAriaLabel: t("admin-organizations:delete.closeAriaLabel"),
          dimensions: "m",
        }
      );
    },
    [hide, loadData, show, t]
  );

  const columns = useMemo(
    () =>
      createOrganizationColumns({
        deletingOrgId,
        labels: {
          name: t("admin-organizations:columns.name"),
          createdAt: t("admin-organizations:columns.createdAt"),
          datasets: t("admin-organizations:columns.datasets"),
          reuses: t("admin-organizations:columns.reuses"),
          members: t("admin-organizations:columns.members"),
          deleteAriaLabel: (name) =>
            t("admin-organizations:columns.deleteAriaLabel", { name }),
        },
        onDelete: handleDeleteOrg,
      }),
    [deletingOrgId, handleDeleteOrg, t]
  );

  useEffect(() => {
    let isActive = true;

    const run = async () => {
      try {
        const response = await fetchOrganizations(currentPage, pageSize, {
          q: searchQuery.trim() || undefined,
          sort: sortParam,
        });
        if (!isActive) return;
        setOrganizations(response.data || []);
        setTotalItems(response.total || 0);
      } catch (error) {
        if (!isActive) return;
        console.error("Error loading organizations:", error);
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
  }, [currentPage, pageSize, searchQuery, sortParam]);

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: t("admin-common:breadcrumbs.administration"), url: "/admin" },
        { label: t("admin-common:breadcrumbs.system"), url: "#" },
        { label: t("admin-organizations:title"), url: "/admin/system/organizations" },
      ]}
      title={t("admin-organizations:title")}
      isLoading={isLoading}
      count={totalItems}
      hasItems={organizations.length > 0}
      currentPage={currentPage}
      pageSize={pageSize}
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
      search={{
        label: pageContent.search?.label,
        placeholder: pageContent.search?.placeholder ?? "",
        hint: pageContent.search?.hint,
        onChange: handleSearch,
      }}
      emptyState={<AdminSquidexEmptyState noResults={pageContent.systemNoResults} />}
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

