"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CardNoResults, Icon } from "@ama-pt/agora-design-system";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import { fetchDataservices } from "@/services/api";
import { Dataservice } from "@/types/api";
import { filterByStatus } from "@/utils/filterByStatus";
import { SortOrder, useSortControls } from "@/components/admin/lists/useClientTableState";
import { useDebouncedSearch } from "@/components/admin/lists/useDebouncedSearch";
import { buildApiSortParam } from "@/components/admin/lists/listHelpers";
import StatusFilterSelect from "../StatusFilterSelect";
import {
  DataserviceSortField,
  createDataserviceColumns,
  dataserviceSortFieldMap,
} from "./dataservicesListConfig";

export default function SystemDataservicesClient() {
  const [apis, setApis] = useState<Dataservice[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState<DataserviceSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");

  const sortParam = useMemo(
    () => buildApiSortParam(sortField, sortOrder, dataserviceSortFieldMap),
    [sortField, sortOrder]
  );
  const columns = useMemo(
    () => createDataserviceColumns({ ownerMetaStyle: "by" }),
    []
  );

  const { handleSort, getSortOrder } = useSortControls(
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    setCurrentPage
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchDataservices(currentPage, pageSize, {
        q: searchQuery.trim() || undefined,
        sort: sortParam,
      });
      setApis(response.data || []);
      setTotalItems(response.total || 0);
    } catch (error) {
      console.error("Error loading dataservices:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, sortParam]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = useDebouncedSearch((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  });

  const filteredApis = useMemo(() => filterByStatus(apis, statusFilter), [apis, statusFilter]);

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: "Sistema", url: "#" },
        { label: "API", url: "/pages/admin/system/dataservices" },
      ]}
      title="API"
      isLoading={isLoading}
      count={totalItems}
      hasItems={filteredApis.length > 0}
      currentPage={currentPage}
      pageSize={pageSize}
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
      search={{
        placeholder: "Pesquise o nome da API",
        ariaLabel: "Pesquisar APIs",
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
          icon={<Icon name="agora-line-code" className="icon-xl h-12 w-12 text-primary-500" />}
          title="Sem APIs"
          description="Nenhuma API encontrada."
          hasAnchor={false}
        />
      }
    >
      <AdminListTable
        items={filteredApis}
        columns={columns}
        getSortOrder={getSortOrder}
        handleSort={handleSort}
        getRowKey={(api) => api.id}
      />
    </AdminListPage>
  );
}
