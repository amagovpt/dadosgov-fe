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
import { buildOrganizationAdminBreadcrumbItems } from "@/utils/adminBreadcrumbs";
import { SortOrder, useSortControls } from "@/hooks/admin-lists/useClientTableState";
import { paginateItems } from "@/utils/admin-lists/listHelpers";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminSquidexEmptyState from "@/components/admin/lists/AdminSquidexEmptyState";
import { StatusFilterSelect } from "@/components/admin/StatusFilterSelect";
import { ReuseSortField, createReuseColumns, sortReuses } from "@/components/admin/reuses/config/reusesListConfig";
import type { BoReusesPage } from "@/service/types/admin/reuses";

interface OrgReusesClientProps {
  orgId?: string;
  pageContent: BoReusesPage;
}

export default function OrgReusesClient({ pageContent }: OrgReusesClientProps) {
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
      breadcrumbItems={buildOrganizationAdminBreadcrumbItems({
        t,
        organizationLabel: orgName,
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
          noResults={pageContent.orgNoResults}
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

