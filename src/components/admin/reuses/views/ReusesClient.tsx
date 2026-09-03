"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import { fetchReuses } from "@/service/api/reuses";
import { Reuse } from "@/service/types/reuse";
import { useAuth } from "@/context/AuthContext";
import { filterByStatus } from "@/utils/filterByStatus";
import { buildUserAdminBreadcrumbItems } from "@/utils/adminBreadcrumbs";
import { SortOrder, useSortControls } from "@/hooks/admin-lists/useClientTableState";
import { useDebouncedSearch } from "@/hooks/admin-lists/useDebouncedSearch";
import { buildApiSortParam, paginateItems } from "@/utils/admin-lists/listHelpers";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import StatusFilterSelect from "@/components/admin/StatusFilterSelect";
import {
  ReuseSortField,
  createReuseColumns,
  reuseSortFieldMap,
  sortReuses,
} from "@/components/admin/reuses/config/reusesListConfig";
import type { BoReusesPage } from "@/service/types/admin/reuses";

interface ReusesClientProps {
  pageContent: BoReusesPage;
}

export default function ReusesClient({ pageContent }: ReusesClientProps) {
  const { t } = useTranslation(["admin-common", "admin-reuses"]);
  const { user, isLoading: isUserLoading } = useAuth();
  const displayName = user ? `${user.first_name} ${user.last_name}` : "";
  const searchParams = useSearchParams();

  const [reuses, setReuses] = useState<Reuse[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get("status") ?? "");
  const [sortField, setSortField] = useState<ReuseSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");
  const usesLocalSort = sortField === "status";
  // The legacy Me list hid deleted reuses in its unfiltered view. The generic
  // paginated endpoint includes a user's own deleted entries, so preserve that
  // behavior locally until the API provides a non-deleted aggregate status.
  const usesLocalFallback = usesLocalSort || !statusFilter;
  const sortParam = useMemo(
    () =>
      usesLocalSort
        ? undefined
        : buildApiSortParam(sortField, sortOrder, reuseSortFieldMap),
    [sortField, sortOrder, usesLocalSort],
  );

  const { handleSort, getSortOrder } = useSortControls(
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    setCurrentPage
  );

  const loadReuses = useCallback(async () => {
    if (isUserLoading) return;
    if (!user?.id) {
      setReuses([]);
      setTotalItems(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetchReuses(
        usesLocalFallback ? 1 : currentPage,
        usesLocalFallback ? 9999 : itemsPerPage,
        {
          owner: user.id,
          q: searchQuery.trim() || undefined,
          status: statusFilter || undefined,
          sort: sortParam,
        },
      );
      setReuses(response.data || []);
      setTotalItems(response.total || 0);
    } catch (error) {
      console.error("Error loading reuses:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, isUserLoading, itemsPerPage, searchQuery, sortParam, statusFilter, user, usesLocalFallback]);

  useEffect(() => {
    let isActive = true;
    const loadCurrentReuses = async () => {
      if (isActive) await loadReuses();
    };
    void loadCurrentReuses();
    return () => {
      isActive = false;
    };
  }, [loadReuses]);

  const handleSearch = useDebouncedSearch((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  });

  const filteredReuses = useMemo(
    () => (statusFilter ? filterByStatus(reuses, statusFilter) : reuses.filter((reuse) => !reuse.deleted)),
    [reuses, statusFilter],
  );
  const sortedReuses = useMemo(
    () => sortReuses(filteredReuses, sortField, sortOrder),
    [filteredReuses, sortField, sortOrder]
  );
  const paginatedReuses = useMemo(
    () => (usesLocalFallback ? paginateItems(sortedReuses, currentPage, itemsPerPage) : sortedReuses),
    [currentPage, itemsPerPage, sortedReuses, usesLocalFallback]
  );
  const columns = useMemo(
    () =>
      createReuseColumns({
        showOwner: true,
        linkStyle: "textLink",
        editHref: (reuse) => `/admin/me/reuses/edit?id=${reuse.id}`,
        labels: {
          title: t("admin-reuses:columns.title"),
          titleShort: t("admin-reuses:columns.titleShort"),
          status: t("admin-reuses:columns.status"),
          createdAt: t("admin-reuses:columns.createdAt"),
          datasets: t("admin-reuses:columns.datasets"),
          actions: t("admin-reuses:columns.actions"),
        },
      }),
    [t]
  );

  return (
    <AdminListPage
      breadcrumbItems={buildUserAdminBreadcrumbItems({
        t,
        userLabel: displayName,
        sectionLabel: t("admin-reuses:title"),
      })}
      title={t("admin-reuses:title")}
      isLoading={isLoading}
      count={usesLocalFallback ? filteredReuses.length : totalItems}
      hasItems={paginatedReuses.length > 0}
      currentPage={currentPage}
      pageSize={itemsPerPage}
      setCurrentPage={setCurrentPage}
      setPageSize={setItemsPerPage}
      search={{
        label: pageContent.search?.label,
        placeholder: pageContent.search?.placeholder ?? "",
        hint: pageContent.search?.hint,
        onChange: handleSearch,
      }}
      filters={
        <StatusFilterSelect
          value={statusFilter}
          defaultValue={statusFilter || undefined}
          onChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
        />
      }
      emptyState={
        <AdminEmptyState
          noResults={pageContent.myNoResults}
          createUrl="/admin/reuses/new"
        />
      }
    >
      <AdminListTable
        items={paginatedReuses}
        columns={columns}
        getSortOrder={getSortOrder}
        handleSort={handleSort}
        getRowKey={(reuse) => reuse.id}
      />
    </AdminListPage>
  );
}
