"use client";

import { useEffect, useMemo, useState } from "react";
import { CardNoResults, Icon } from "@ama-pt/agora-design-system";
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
  systemReuseSortFieldMap,
} from "@/components/admin/reuses/config/reusesListConfig";

export default function SystemReusesClient() {
  const [reuses, setReuses] = useState<Reuse[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState<SystemReuseSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");

  const sortParam = useMemo(
    () => buildApiSortParam(sortField, sortOrder, systemReuseSortFieldMap),
    [sortField, sortOrder]
  );
  const columns = useMemo(
    () =>
      createReuseColumns({
        sortableDatasets: false,
        editHref: (reuse) => `/pages/admin/reuses/${reuse.id}`,
      }),
    []
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

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: "Sistema", url: "#" },
        { label: "Reutilizações", url: "/pages/admin/system/reuses" },
      ]}
      title="Reutilizações"
      isLoading={isLoading}
      count={totalItems}
      hasItems={filteredReuses.length > 0}
      currentPage={currentPage}
      pageSize={pageSize}
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
      search={{
        placeholder: "Pesquise o nome da reutilização",
        ariaLabel: "Pesquisar reutilizações",
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
        <CardNoResults
          position="center"
          icon={<Icon name="agora-line-edit" className="icon-xl h-12 w-12 text-primary-500" />}
          title="Sem reutilizações"
          description="Nenhuma reutilização encontrada."
          hasAnchor={false}
        />
      }
    >
      <AdminListTable
        items={filteredReuses}
        columns={columns}
        getSortOrder={getSortOrder}
        handleSort={handleSort}
        getRowKey={(reuse) => reuse.id}
      />
    </AdminListPage>
  );
}

