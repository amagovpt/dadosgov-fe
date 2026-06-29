"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import { fetchMyReuses } from "@/service/api/reuses";
import { Reuse } from "@/service/types/reuse";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { filterByStatus } from "@/utils/filterByStatus";
import { SortOrder, useSortControls } from "@/hooks/admin-lists/useClientTableState";
import { useDebouncedSearch } from "@/hooks/admin-lists/useDebouncedSearch";
import { paginateItems } from "@/utils/admin-lists/listHelpers";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import StatusFilterSelect from "@/components/admin/StatusFilterSelect";
import { ReuseSortField, createReuseColumns, sortReuses } from "@/components/admin/reuses/config/reusesListConfig";

export default function ReusesClient() {
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
      }),
    []
  );

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: "Administração", url: "/admin" },
        { label: displayName || "...", url: "#" },
        { label: "Reutilizações", url: "/admin/me/reuses" },
      ]}
      title="Reutilizações"
      isLoading={isLoading}
      count={filteredReuses.length}
      currentPage={currentPage}
      pageSize={itemsPerPage}
      setCurrentPage={setCurrentPage}
      setPageSize={setItemsPerPage}
      search={{
        placeholder: "Pesquise o nome da reutilização",
        ariaLabel: "Pesquisar reutilizações",
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
          icon="bar_chart"
          title="Sem reutilizações"
          description="Não publicou reutilizações"
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

