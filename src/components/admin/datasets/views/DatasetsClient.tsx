"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@ama-pt/agora-design-system";
import { StatusFilterSelect } from "@/components/admin/StatusFilterSelect";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import { paginateItems } from "@/utils/admin-lists/listHelpers";
import { fetchMyDatasets } from "@/service/api/datasets";
import { Dataset } from "@/service/types/dataset";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { filterByStatus } from "@/utils/filterByStatus";
import { buildUserAdminBreadcrumbItems } from "@/utils/adminBreadcrumbs";
import { SortOrder, useSortControls } from "@/hooks/admin-lists/useClientTableState";
import {
  createDatasetColumns,
  DatasetSortField,
  sortDatasets,
} from "@/components/admin/datasets/config/datasetsListConfig";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import type { BoDatasetsPage } from "@/service/types/admin/datasets";

interface DatasetsClientProps {
  pageContent: BoDatasetsPage;
}

export default function DatasetsClient({ pageContent }: DatasetsClientProps) {
  const { t } = useTranslation(["admin-common", "admin-datasets"]);
  const { displayName } = useCurrentUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [allDatasets, setAllDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<DatasetSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get("status") ?? "");

  useEffect(() => {
    async function loadDatasets() {
      setIsLoading(true);
      try {
        const response = await fetchMyDatasets(1, 9999);
        setAllDatasets(response.data || []);
      } catch (error) {
        console.error("Error loading datasets:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadDatasets();
  }, []);

  const filteredDatasets = useMemo(() => {
    let result = allDatasets;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (dataset) =>
          dataset.title.toLowerCase().includes(q) ||
          (dataset.acronym && dataset.acronym.toLowerCase().includes(q)) ||
          dataset.slug.toLowerCase().includes(q),
      );
    }

    if (statusFilter) {
      result = filterByStatus(result, statusFilter);
    } else {
      result = result.filter((dataset) => !dataset.deleted);
    }

    return result;
  }, [allDatasets, searchQuery, statusFilter]);

  const sortedDatasets = useMemo(
    () => sortDatasets(filteredDatasets, sortField, sortOrder),
    [filteredDatasets, sortField, sortOrder],
  );
  const datasets = useMemo(
    () => paginateItems(sortedDatasets, currentPage, pageSize),
    [sortedDatasets, currentPage, pageSize],
  );
  const columns = useMemo(
    () =>
      createDatasetColumns({
        editHref: (dataset) => `/admin/me/datasets/edit?id=${dataset.id}`,
        showOwner: true,
        showResourceCount: true,
        showQualityScore: true,
        labels: {
          title: t("admin-datasets:list.columns.title"),
          titleShort: t("admin-datasets:list.columns.titleShort"),
          status: t("admin-datasets:list.columns.status"),
          createdAt: t("admin-datasets:list.columns.createdAt"),
          lastModified: t("admin-datasets:list.columns.lastModified"),
          resources: t("admin-datasets:list.columns.resources"),
          quality: t("admin-datasets:list.columns.quality"),
          actions: t("admin-datasets:list.columns.actions"),
        },
      }),
    [t],
  );

  const { handleSort, getSortOrder } = useSortControls(
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    setCurrentPage,
  );

  return (
    <AdminListPage
      breadcrumbItems={buildUserAdminBreadcrumbItems({
        t,
        userLabel: displayName,
        sectionLabel: t("admin-datasets:list.title"),
      })}
      title={t("admin-datasets:list.heroTitle")}
      kicker={t("admin-datasets:list.kicker")}
      description={t("admin-datasets:list.heroDescription")}
      listTitle={t("admin-datasets:list.myListTitle")}
      resultsCount={null}
      headerAction={
        <Button
          variant="primary"
          hasIcon
          leadingIcon="agora-line-plus-circle"
          leadingIconHover="agora-solid-plus-circle"
          onClick={() => router.push("/admin/datasets/new")}
        >
          {t("admin-datasets:list.create")}
        </Button>
      }
      isLoading={isLoading}
      count={sortedDatasets.length}
      currentPage={currentPage}
      pageSize={pageSize}
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
      search={{
        label: pageContent.search?.label,
        placeholder: pageContent.search?.placeholder ?? "",
        hint: pageContent.search?.hint,
        onChange: (value) => {
          setSearchQuery(value);
          setCurrentPage(1);
        },
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
          illustration={<img src="/emoji-empty.svg" alt="" width={280} height={143} />}
          title={
            <div className="title">
              {t("admin-datasets:list.emptyTitlePrefix")}{" "}
              <b className="font-bold">{t("admin-datasets:list.emptyTitleHighlight")}</b>
            </div>
          }
          subtitle={t("admin-datasets:list.emptySubtitle")}
          description={t("admin-datasets:list.emptyDescription")}
        />
      }
    >
      <AdminListTable
        items={datasets}
        columns={columns}
        getSortOrder={getSortOrder}
        handleSort={handleSort}
        getRowKey={(dataset) => dataset.id}
      />
    </AdminListPage>
  );
}
