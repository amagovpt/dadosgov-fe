"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import { StatusFilterSelect } from "@/components/admin/StatusFilterSelect";
import { fetchReuses } from "@/service/api/reuses";
import { Reuse } from "@/service/types/reuse";
import { filterByStatus } from "@/utils/filterByStatus";
import { SortOrder, useSortControls } from "@/hooks/admin-lists/useClientTableState";
import { useDebouncedSearch } from "@/hooks/admin-lists/useDebouncedSearch";
import { buildApiSortParam } from "@/utils/admin-lists/listHelpers";
import {
  SystemReuseSortField,
  createReuseColumns,
  sortReuses,
  systemReuseSortFieldMap,
} from "@/components/admin/reuses/config/reusesListConfig";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import type { BoReusesPage } from "@/service/types/admin/reuses";

interface SystemReusesClientProps {
  pageContent: BoReusesPage;
}

export default function SystemReusesClient({ pageContent }: SystemReusesClientProps) {
  const { t } = useTranslation(["admin-common", "admin-reuses"]);
  const [reuses, setReuses] = useState<Reuse[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState<SystemReuseSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");
  const usesLocalSort = sortField === "status";

  const sortParam = useMemo(
    () => (usesLocalSort ? undefined : buildApiSortParam(sortField, sortOrder, systemReuseSortFieldMap)),
    [sortField, sortOrder, usesLocalSort]
  );
  const columns = useMemo(
    () =>
      createReuseColumns({
        sortableDatasets: false,
        editHref: (reuse) => `/admin/reuses/${reuse.id}`,
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

  const { handleSort, getSortOrder } = useSortControls(
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    setCurrentPage
  );

  useEffect(() => {
    let isActive = true;

    const run = async () => {
      try {
        const response = await fetchReuses(currentPage, pageSize, {
          q: searchQuery.trim() || undefined,
          sort: sortParam,
        });
        if (!isActive) return;
        setReuses(response.data || []);
        setTotalItems(response.total || 0);
      } catch (error) {
        if (!isActive) return;
        console.error("Error loading reuses:", error);
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

  const handleSearch = useDebouncedSearch((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  });

  const filteredReuses = useMemo(
    () => filterByStatus(reuses, statusFilter),
    [reuses, statusFilter]
  );
  const visibleReuses = useMemo(
    () => (usesLocalSort ? sortReuses(filteredReuses, sortField, sortOrder) : filteredReuses),
    [filteredReuses, sortField, sortOrder, usesLocalSort]
  );

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: t("admin-common:breadcrumbs.administration"), url: "/admin" },
        { label: t("admin-common:breadcrumbs.system"), url: "#" },
        { label: t("admin-reuses:title"), url: "/admin/system/reuses" },
      ]}
      title={t("admin-reuses:title")}
      isLoading={isLoading}
      count={totalItems}
      hasItems={visibleReuses.length > 0}
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
      emptyState={<AdminEmptyState noResults={pageContent.systemNoResults} />}
    >
      <AdminListTable
        items={visibleReuses}
        columns={columns}
        getSortOrder={getSortOrder}
        handleSort={handleSort}
        getRowKey={(reuse) => reuse.id}
      />
    </AdminListPage>
  );
}

