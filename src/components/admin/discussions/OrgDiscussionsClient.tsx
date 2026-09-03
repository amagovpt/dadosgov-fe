"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { usePopupContext } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";
import { StatusFilterSelect } from "@/components/admin/StatusFilterSelect";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import { useAdminListController } from "@/hooks/admin-lists/useAdminListController";
import { fetchOrgDiscussions } from "@/service/api/discussions-topics";
import { Discussion } from "@/service/types/discussion";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useAuth } from "@/context/AuthContext";
import DiscussionDetailPopup from "@/components/admin/discussions/DiscussionDetailPopup";
import AdminEmptyState from "../AdminEmptyState";
import {
  createOrgDiscussionColumns,
  discussionSortFieldMap,
  type DiscussionSortField,
} from "./discussionsListConfig";
import type { BoDiscussionsPage } from "@/service/types/admin/discussions";

const formatDate = (dateStr: string) => {
  try {
    return format(new Date(dateStr), "d 'de' MMMM 'de' yyyy HH:mm", { locale: pt });
  } catch {
    return dateStr;
  }
};

interface OrgDiscussionsClientProps {
  orgId: string;
  pageContent: BoDiscussionsPage;
}

export default function OrgDiscussionsClient({ orgId, pageContent }: OrgDiscussionsClientProps) {
  const { t } = useTranslation(["admin-common", "admin-discussions"]);
  const { user } = useAuth();
  const { show } = usePopupContext();
  const orgName = useViewedOrganizationName(orgId, user?.organizations);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    searchQuery,
    handleSearch,
    sortParam,
    handleSort,
    getSortOrder,
    filters,
    updateFilter,
  } = useAdminListController<DiscussionSortField, { closedFilter: string }>({
    initialFilters: { closedFilter: "" },
    sortFieldMap: discussionSortFieldMap,
  });

  useEffect(() => {
    async function loadDiscussions() {
      setIsLoading(true);
      try {
        const data = await fetchOrgDiscussions(orgId, currentPage, pageSize, {
          q: searchQuery.trim() || undefined,
          closed: filters.closedFilter === "" ? undefined : filters.closedFilter === "closed",
          sort: sortParam,
        });
        setDiscussions(data.data ?? []);
        setTotalItems(data.total ?? 0);
      } catch (error) {
        console.error("Error loading discussions:", error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadDiscussions();
  }, [orgId, currentPage, pageSize, searchQuery, filters.closedFilter, sortParam]);

  const openDiscussion = useCallback(
    (discussion: Discussion) => {
      show(
        <DiscussionDetailPopup
          discussion={discussion}
          onUpdated={(updated) =>
            setDiscussions((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
          }
          onDeleted={() => setDiscussions((prev) => prev.filter((item) => item.id !== discussion.id))}
        />,
        {
          title: t("admin-discussions:popup.title"),
          closeAriaLabel: t("admin-common:deleteAccount.closeAriaLabel"),
          dimensions: "l",
        },
      );
    },
    [show, t]
  );

  const columns = useMemo(
    () =>
      createOrgDiscussionColumns({
        onOpenDiscussion: openDiscussion,
        formatDate,
        labels: {
          title: t("admin-discussions:columns.title"),
          author: t("admin-discussions:columns.author"),
          status: t("admin-discussions:columns.status"),
          date: t("admin-discussions:columns.date"),
          messages: t("admin-discussions:columns.messages"),
          createdAt: t("admin-discussions:columns.createdAt"),
          closedAt: t("admin-discussions:columns.closedAt"),
          open: t("admin-discussions:status.open"),
          closed: t("admin-discussions:status.closed"),
        },
      }),
    [openDiscussion, t],
  );

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: t("admin-common:breadcrumbs.administration"), url: "/admin" },
        { label: orgName || t("admin-common:breadcrumbs.organization"), url: "#" },
        { label: t("admin-discussions:title") },
      ]}
      title={pageContent.orgHero?.title ?? ""}
      isLoading={isLoading}
      count={totalItems}
      currentPage={currentPage}
      pageSize={pageSize}
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
      search={{
        label: t("admin-discussions:filters.search.label"),
        placeholder: t("admin-discussions:filters.search.placeholder"),
        ariaLabel: t("admin-discussions:filters.search.label"),
        onChange: handleSearch,
      }}
      filters={
        <StatusFilterSelect
          id="discussion-filter-status"
          value={filters.closedFilter}
          onChange={(value) => updateFilter("closedFilter", value)}
          placeholder={t("admin-discussions:filters.status.placeholder")}
          options={[
            { value: "", label: t("admin-discussions:filters.all") },
            { value: "open", label: t("admin-discussions:status.open") },
            { value: "closed", label: t("admin-discussions:status.closed") },
          ]}
        />
      }
      emptyState={
        <AdminEmptyState
          icon="agora-line-chat"
          title={pageContent.orgNoResults?.title ?? ""}
          description={pageContent.orgNoResults?.description ?? ""}
        />
      }
    >
      <AdminListTable
        items={discussions}
        columns={columns}
        getSortOrder={getSortOrder}
        handleSort={handleSort}
        getRowKey={(discussion) => discussion.id}
        getRowClassName={() => "cursor-pointer hover:bg-neutral-50"}
        onRowClick={openDiscussion}
      />
    </AdminListPage>
  );
}
