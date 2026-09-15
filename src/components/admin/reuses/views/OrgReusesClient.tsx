"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import { fetchReuses } from "@/service/api/reuses";
import { Reuse } from "@/service/types/reuse";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useAuth } from "@/context/AuthContext";
import { buildOrganizationAdminBreadcrumbItems } from "@/utils/adminBreadcrumbs";
import { SortOrder, useSortControls } from "@/hooks/admin-lists/useClientTableState";
import { buildApiSortParam, paginateItems } from "@/utils/admin-lists/listHelpers";
import { useDebouncedSearch } from "@/hooks/admin-lists/useDebouncedSearch";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import { StatusFilterSelect } from "@/components/admin/StatusFilterSelect";
import {
  ReuseSortField,
  createReuseColumns,
  reuseSortFieldMap,
  sortReuses,
} from "@/components/admin/reuses/config/reusesListConfig";
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
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<ReuseSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");
  const usesLocalSort = sortField === "status";
  const sortParam = useMemo(
    () =>
      usesLocalSort
        ? undefined
        : buildApiSortParam(sortField, sortOrder, reuseSortFieldMap),
    [sortField, sortOrder, usesLocalSort],
  );

  const { handleSort, getSortOrder } = useSortControls(
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    setCurrentPage
  );

  const loadReuses = useCallback(async () => {
    if (!resolvedOrgId) {
      setReuses([]);
      setTotalItems(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetchReuses(
        usesLocalSort ? 1 : currentPage,
        usesLocalSort ? 9999 : itemsPerPage,
        {
          organization: resolvedOrgId,
          q: searchQuery.trim() || undefined,
          status: statusFilter || undefined,
          sort: sortParam,
        },
      );
      setReuses(response.data || []);
      setTotalItems(response.total || 0);
    } catch (error) {
      console.error("Error loading org reuses:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, resolvedOrgId, searchQuery, sortParam, statusFilter, usesLocalSort]);

  useEffect(() => {
    let isCancelled = false;
    const loadCurrentReuses = async () => {
      if (!isCancelled) await loadReuses();
    };
    void loadCurrentReuses();
    return () => {
      isCancelled = true;
    };
  }, [loadReuses]);

  const handleSearch = useDebouncedSearch((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  });

  const sortedReuses = useMemo(
    () => sortReuses(reuses, sortField, sortOrder),
    [reuses, sortField, sortOrder]
  );
  const paginatedReuses = useMemo(
    () => (usesLocalSort ? paginateItems(sortedReuses, currentPage, itemsPerPage) : sortedReuses),
    [currentPage, itemsPerPage, sortedReuses, usesLocalSort]
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
          actions: t("admin-reuses:columns.actions"),
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
        organizationLabel: orgName ?? undefined,
        sectionLabel: t("admin-reuses:title"),
      })}
      title={t("admin-reuses:title")}
      isLoading={isLoading}
      count={usesLocalSort ? reuses.length : totalItems}
      hasItems={paginatedReuses.length > 0}
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
          onChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
        />
      }
      emptyState={
        <AdminEmptyState
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
