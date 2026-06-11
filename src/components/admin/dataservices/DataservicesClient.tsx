"use client";

import { useEffect, useMemo, useState } from "react";
import { StatusFilterSelect } from "@/components/admin/StatusFilterSelect";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import { fetchMyDataservices } from "@/services/api";
import { Dataservice } from "@/types/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { filterByStatus } from "@/utils/filterByStatus";
import { SortOrder, useSortControls } from "@/components/admin/lists/useClientTableState";
import { paginateItems } from "@/components/admin/lists/listHelpers";
import {
  DataserviceSortField,
  createDataserviceColumns,
  sortDataservices,
} from "./dataservicesListConfig";
import AdminEmptyState from "../AdminEmptyState";

export default function DataservicesClient() {
  const { displayName } = useCurrentUser();

  const [apis, setApis] = useState<Dataservice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState<DataserviceSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");

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
  const paginatedApis = useMemo(
    () => paginateItems(sortedApis, currentPage, pageSize),
    [sortedApis, currentPage, pageSize]
  );
  const columns = useMemo(
    () => createDataserviceColumns({ ownerMetaStyle: "dot" }),
    []
  );

  useEffect(() => {
    async function loadDataservices() {
      setIsLoading(true);
      try {
        const response = await fetchMyDataservices(1, 9999);
        setApis(response.data || []);
      } catch (error) {
        console.error("Error loading dataservices:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadDataservices();
  }, []);

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: displayName || "...", url: "#" },
        { label: "API", url: "/pages/admin/dataservices" },
      ]}
      title="API"
      isLoading={isLoading}
      count={filteredApis.length}
      currentPage={currentPage}
      pageSize={pageSize}
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
      search={{
        placeholder: "Pesquise o nome da API",
        ariaLabel: "Pesquisar APIs",
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
      emptyState={<AdminEmptyState icon="agora-line-edit" createUrl="/pages/admin/dataservices/new" />}
    >
      <AdminListTable
        items={paginatedApis}
        columns={columns}
        getSortOrder={getSortOrder}
        handleSort={handleSort}
        getRowKey={(api) => api.id}
      />
    </AdminListPage>
  );
}
