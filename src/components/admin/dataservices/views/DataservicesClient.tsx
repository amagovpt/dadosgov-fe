"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StatusFilterSelect } from "@/components/admin/StatusFilterSelect";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import { fetchAdminDataservices } from "@/service/api/dataservices";
import { Dataservice } from "@/service/types/dataservice";
import { useAuth } from "@/context/AuthContext";
import { filterByStatus } from "@/utils/filterByStatus";
import { buildUserAdminBreadcrumbItems } from "@/utils/adminBreadcrumbs";
import { SortOrder, useSortControls } from "@/hooks/admin-lists/useClientTableState";
import { buildApiSortParam, paginateItems } from "@/utils/admin-lists/listHelpers";
import { useDebouncedSearch } from "@/hooks/admin-lists/useDebouncedSearch";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import {
  createDataserviceColumns,
  dataserviceSortFieldMap,
  DataserviceSortField,
  sortDataservices,
} from "../config/dataservicesListConfig";
import type { BoDataservicesPage } from "@/service/types/admin/dataservices";

interface DataservicesClientProps {
  pageContent: BoDataservicesPage;
}

export default function DataservicesClient({ pageContent }: DataservicesClientProps) {
  const { t } = useTranslation(["admin-common", "admin-dataservices"]);
  const { user, isLoading: isUserLoading } = useAuth();
  const displayName = user ? `${user.first_name} ${user.last_name}` : "";

  const [apis, setApis] = useState<Dataservice[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<DataserviceSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");
  const usesLocalFallback = Boolean(statusFilter) || sortField === "status";
  const sortParam = useMemo(
    () =>
      sortField === "status"
        ? undefined
        : buildApiSortParam(sortField, sortOrder, dataserviceSortFieldMap),
    [sortField, sortOrder],
  );

  const { handleSort, getSortOrder } = useSortControls(
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    setCurrentPage
  );

  const filteredApis = useMemo(() => filterByStatus(apis, statusFilter), [apis, statusFilter]);
  const sortedApis = useMemo(
    () => sortDataservices(filteredApis, sortField, sortOrder),
    [filteredApis, sortField, sortOrder]
  );
  const visibleApis = useMemo(
    () => (usesLocalFallback ? paginateItems(sortedApis, currentPage, pageSize) : sortedApis),
    [currentPage, pageSize, sortedApis, usesLocalFallback],
  );
  const columns = useMemo(
    () =>
      createDataserviceColumns({
        ownerMetaStyle: "dot",
        labels: {
          title: t("admin-dataservices:columns.title"),
          titleShort: t("admin-dataservices:columns.titleShort"),
          status: t("admin-dataservices:columns.status"),
          createdAt: t("admin-dataservices:columns.createdAt"),
          modifiedAt: t("admin-dataservices:columns.modifiedAt"),
          by: t("admin-dataservices:columns.by"),
          about: t("admin-dataservices:columns.about"),
        },
      }),
    [t]
  );

  const loadDataservices = useCallback(async () => {
    if (isUserLoading) return;
    if (!user?.id) {
      setApis([]);
      setTotalItems(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetchAdminDataservices(
        usesLocalFallback ? 1 : currentPage,
        usesLocalFallback ? 9999 : pageSize,
        {
          owner: user.id,
          q: searchQuery.trim() || undefined,
          sort: sortParam,
        },
      );
      setApis(response.data || []);
      setTotalItems(response.total || 0);
    } catch (error) {
      console.error("Error loading dataservices:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, isUserLoading, pageSize, searchQuery, sortParam, user, usesLocalFallback]);

  useEffect(() => {
    let isCancelled = false;
    const loadCurrentDataservices = async () => {
      if (isCancelled) return;
      await loadDataservices();
    };
    void loadCurrentDataservices();
    return () => {
      isCancelled = true;
    };
  }, [loadDataservices]);

  const handleSearch = useDebouncedSearch((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  });

  return (
    <AdminListPage
      breadcrumbItems={buildUserAdminBreadcrumbItems({
        t,
        userLabel: displayName,
        sectionLabel: t("admin-dataservices:title"),
      })}
      title={t("admin-dataservices:title")}
      isLoading={isLoading}
      count={usesLocalFallback ? filteredApis.length : totalItems}
      hasItems={visibleApis.length > 0}
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
      filters={
        <StatusFilterSelect
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
        />
      }
      emptyState={
        <AdminEmptyState
          noResults={pageContent.myNoResults}
          createUrl="/admin/dataservices/new"
        />
      }
    >
      <AdminListTable
        items={visibleApis}
        columns={columns}
        getSortOrder={getSortOrder}
        handleSort={handleSort}
        getRowKey={(api) => api.id}
      />
    </AdminListPage>
  );
}
