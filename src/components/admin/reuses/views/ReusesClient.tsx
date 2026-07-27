"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import { fetchMyReuses } from "@/service/api/reuses";
import { Reuse } from "@/service/types/reuse";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { filterByStatus } from "@/utils/filterByStatus";
import { buildUserAdminBreadcrumbItems } from "@/utils/adminBreadcrumbs";
import { SortOrder, useSortControls } from "@/hooks/admin-lists/useClientTableState";
import { useDebouncedSearch } from "@/hooks/admin-lists/useDebouncedSearch";
import { paginateItems } from "@/utils/admin-lists/listHelpers";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import StatusFilterSelect from "@/components/admin/StatusFilterSelect";
import { ReuseSortField, createReuseColumns, sortReuses } from "@/components/admin/reuses/config/reusesListConfig";
import type { BoReusesPage } from "@/service/types/admin/reuses";

interface ReusesClientProps {
  pageContent: BoReusesPage;
}

export default function ReusesClient({ pageContent }: ReusesClientProps) {
  const { t } = useTranslation(["admin-common", "admin-reuses"]);
  const { displayName } = useCurrentUser();
  const searchParams = useSearchParams();

  const [reuses, setReuses] = useState<Reuse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get("status") ?? "");
  const [sortField, setSortField] = useState<ReuseSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");

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
        const response = await fetchMyReuses(1, 9999);
        if (!isActive) return;
        setReuses(response.data || []);
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
  }, []);

  const handleSearch = useDebouncedSearch((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  });

  const filteredReuses = useMemo(() => {
    let result = reuses;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((r) => r.title.toLowerCase().includes(q));
    }
    if (statusFilter) {
      result = filterByStatus(result, statusFilter);
    } else {
      result = result.filter((r) => !r.deleted);
    }
    return result;
  }, [reuses, searchQuery, statusFilter]);

  const sortedReuses = useMemo(
    () => sortReuses(filteredReuses, sortField, sortOrder),
    [filteredReuses, sortField, sortOrder]
  );
  const paginatedReuses = useMemo(
    () => paginateItems(sortedReuses, currentPage, itemsPerPage),
    [sortedReuses, currentPage, itemsPerPage]
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
      count={filteredReuses.length}
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

