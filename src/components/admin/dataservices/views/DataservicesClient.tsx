"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StatusFilterSelect } from "@/components/admin/StatusFilterSelect";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import { fetchMyDataservices } from "@/service/api/dataservices";
import { Dataservice } from "@/service/types/dataservice";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { filterByStatus } from "@/utils/filterByStatus";
import { SortOrder, useSortControls } from "@/hooks/admin-lists/useClientTableState";
import { paginateItems } from "@/utils/admin-lists/listHelpers";
import AdminSquidexEmptyState from "@/components/admin/lists/AdminSquidexEmptyState";
import {
  createDataserviceColumns,
  DataserviceSortField,
  sortDataservices,
} from "../config/dataservicesListConfig";
import type { BoDataservicesPage } from "@/service/types/admin/dataservices";

interface DataservicesClientProps {
  pageContent: BoDataservicesPage;
}

export default function DataservicesClient({ pageContent }: DataservicesClientProps) {
  const { t } = useTranslation(["admin-common", "admin-dataservices"]);
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
        { label: t("admin-common:breadcrumbs.administration"), url: "/admin" },
        { label: displayName || "...", url: "#" },
        { label: t("admin-dataservices:title"), url: "/admin/dataservices" },
      ]}
      title={t("admin-dataservices:title")}
      isLoading={isLoading}
      count={filteredApis.length}
      currentPage={currentPage}
      pageSize={pageSize}
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
      search={{
        label: pageContent.search?.label,
        placeholder: pageContent.search?.placeholder ?? "",
        hint: pageContent.search?.hint,
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
        <AdminSquidexEmptyState
          noResults={pageContent.myNoResults}
          createUrl="/admin/dataservices/new"
        />
      }
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

