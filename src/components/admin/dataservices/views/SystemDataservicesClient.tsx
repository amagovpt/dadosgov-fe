"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CardNoResults, Icon } from "@ama-pt/agora-design-system";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import { fetchDataservices } from "@/service/api/dataservices";
import { Dataservice } from "@/service/types/dataservice";
import { filterByStatus } from "@/utils/filterByStatus";
import { SortOrder, useSortControls } from "@/hooks/admin-lists/useClientTableState";
import { useDebouncedSearch } from "@/hooks/admin-lists/useDebouncedSearch";
import { buildApiSortParam } from "@/utils/admin-lists/listHelpers";
import StatusFilterSelect from "@/components/admin/StatusFilterSelect";
import {
  DataserviceSortField,
  createDataserviceColumns,
  dataserviceSortFieldMap,
} from "@/components/admin/dataservices/config/dataservicesListConfig";

export default function SystemDataservicesClient() {
  const { t } = useTranslation(["admin-common", "admin-dataservices"]);
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
    () =>
      createDataserviceColumns({
        ownerMetaStyle: "by",
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
        const response = await fetchDataservices(currentPage, pageSize, {
          q: searchQuery.trim() || undefined,
          sort: sortParam,
        });
        if (!isActive) return;
        setApis(response.data || []);
        setTotalItems(response.total || 0);
      } catch (error) {
        if (!isActive) return;
        console.error("Error loading dataservices:", error);
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

  const filteredApis = useMemo(() => filterByStatus(apis, statusFilter), [apis, statusFilter]);

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: t("admin-common:breadcrumbs.administration"), url: "/admin" },
        { label: t("admin-common:breadcrumbs.system"), url: "#" },
        { label: t("admin-dataservices:title"), url: "/admin/system/dataservices" },
      ]}
      title={t("admin-dataservices:title")}
      isLoading={isLoading}
      count={totalItems}
      hasItems={filteredApis.length > 0}
      currentPage={currentPage}
      pageSize={pageSize}
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
      search={{
        placeholder: t("admin-dataservices:search.placeholder"),
        ariaLabel: t("admin-dataservices:search.ariaLabel"),
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
          title={t("admin-dataservices:empty.title")}
          description={t("admin-dataservices:empty.description")}
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

