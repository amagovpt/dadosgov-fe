"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import { fetchOrgReuses } from "@/service/api/organizations";
import { Reuse } from "@/service/types/reuse";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useAuth } from "@/context/AuthContext";
import { filterByStatus } from "@/utils/filterByStatus";
import { SortOrder, useSortControls } from "@/hooks/admin-lists/useClientTableState";
import { paginateItems } from "@/utils/admin-lists/listHelpers";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import { StatusFilterSelect } from "@/components/admin/StatusFilterSelect";
import { ReuseSortField, createReuseColumns, sortReuses } from "@/components/admin/reuses/config/reusesListConfig";

export default function OrgReusesClient() {
  const { t } = useTranslation(["admin-common", "admin-reuses"]);
  const params = useParams();
  const routeOrgId = (params?.orgId as string | undefined) ?? undefined;
  const { activeOrg, isLoading: isOrgLoading } = useActiveOrganization();
  const resolvedOrgId = routeOrgId ?? activeOrg?.id;
  const { user } = useAuth();
  const orgName = useViewedOrganizationName(resolvedOrgId, user?.organizations);

  const [reuses, setReuses] = useState<Reuse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");
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
    if (!resolvedOrgId) return;

    let isCancelled = false;
    const timeoutId = setTimeout(() => {
      setIsLoading(true);
      void fetchOrgReuses(resolvedOrgId)
        .then((data) => {
          if (!isCancelled) setReuses(data || []);
        })
        .catch((error) => {
          console.error("Error loading org reuses:", error);
        })
        .finally(() => {
          if (!isCancelled) setIsLoading(false);
        });
    }, 0);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [resolvedOrgId]);

  const filteredReuses = useMemo(
    () => filterByStatus(reuses, statusFilter),
    [reuses, statusFilter]
  );
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
        linkStyle: "anchor",
        editHref: (reuse) => `/admin/org/reuses/edit?slug=${reuse.slug}`,
        labels: {
          title: t("admin-reuses:columns.title"),
          titleShort: t("admin-reuses:columns.titleShort"),
          status: t("admin-reuses:columns.status"),
          createdAt: t("admin-reuses:columns.createdAt"),
          datasets: t("admin-reuses:columns.datasets"),
        },
      }),
    [t]
  );

  if (!isOrgLoading && !resolvedOrgId) {
    return (
      <AdminEmptyState
        icon="agora-line-user-buildings"
        title={t("admin-reuses:empty.noOrganizationTitle")}
        description={t("admin-reuses:empty.noOrganizationDescription")}
      />
    );
  }

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: t("admin-common:breadcrumbs.administration"), url: "/admin" },
        { label: orgName || t("admin-common:breadcrumbs.organization"), url: "#" },
        { label: t("admin-reuses:title"), url: "#" },
      ]}
      title={t("admin-reuses:title")}
      isLoading={isLoading}
      count={filteredReuses.length}
      currentPage={currentPage}
      pageSize={itemsPerPage}
      setCurrentPage={setCurrentPage}
      setPageSize={setItemsPerPage}
      search={{
        placeholder: t("admin-reuses:search.placeholder"),
        ariaLabel: t("admin-reuses:search.ariaLabel"),
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
        <AdminEmptyState
          icon="agora-line-edit"
          title={t("admin-reuses:empty.publicationsTitle")}
          description={t("admin-reuses:empty.orgDescription")}
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

