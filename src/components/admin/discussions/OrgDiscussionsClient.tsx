"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Toggle, ToggleGroup, usePopupContext } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";
import DiscussionsFilters from "./DiscussionsFilters";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import { useAdminListController } from "@/hooks/admin-lists/useAdminListController";
import { fetchDiscussions, fetchOrgDiscussions } from "@/service/api/discussions-topics";
import { Discussion } from "@/service/types/discussion";
import DiscussionDetailPopup from "@/components/admin/discussions/DiscussionDetailPopup";
import { useCsvExport } from "@/hooks/admin-lists/useCsvExport";
import AdminEmptyState from "../AdminEmptyState";
import {
  createOrgDiscussionColumns,
  discussionSortFieldMap,
  type DiscussionSortField,
} from "./discussionsListConfig";
import type { BoDiscussionsPage } from "@/service/types/admin/discussions";
import { formatDateToDMY } from "@/utils/formatDate";

interface OrgDiscussionsClientProps {
  orgId: string;
  pageContent: BoDiscussionsPage;
}

export default function OrgDiscussionsClient({ orgId, pageContent }: OrgDiscussionsClientProps) {
  const { t } = useTranslation(["admin-common", "admin-discussions"]);
  const downloadListCsv = useCsvExport();
  const { show } = usePopupContext();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    searchQuery,
    setSearchQuery,
    handleSearch,
    sortParam,
    handleSort,
    getSortOrder,
    filters,
    updateFilter,
  } = useAdminListController<DiscussionSortField, { closedFilter: string; scope: string }>({
    initialFilters: { closedFilter: "", scope: "organization" },
    sortFieldMap: discussionSortFieldMap,
  });
  const fetchScopedDiscussions =
    filters.scope === "organization" ? fetchDiscussions : fetchOrgDiscussions;

  useEffect(() => {
    let cancelled = false;
    async function loadDiscussions() {
      setIsLoading(true);
      try {
        const data = await fetchScopedDiscussions(orgId, currentPage, pageSize, {
          q: searchQuery.trim() || undefined,
          closed: filters.closedFilter === "" ? undefined : filters.closedFilter === "closed",
          sort: sortParam,
        });
        if (!cancelled) {
          setDiscussions(data.data ?? []);
          setTotalItems(data.total ?? 0);
        }
      } catch (error) {
        console.error("Error loading discussions:", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadDiscussions();
    return () => {
      cancelled = true;
    };
  }, [
    fetchScopedDiscussions,
    orgId,
    currentPage,
    pageSize,
    searchQuery,
    filters.closedFilter,
    sortParam,
  ]);

  const openDiscussion = useCallback(
    (discussion: Discussion) => {
      show(
        <DiscussionDetailPopup
          key={discussion.id}
          discussion={discussion}
          onUpdated={(updated) =>
            setDiscussions((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
          }
          onDeleted={() =>
            setDiscussions((prev) => prev.filter((item) => item.id !== discussion.id))
          }
        />,
        {
          title: t("admin-discussions:popup.title"),
          closeAriaLabel: t("admin-common:deleteAccount.closeAriaLabel"),
          dimensions: "l",
        }
      );
    },
    [show, t]
  );

  const columns = useMemo(
    () =>
      createOrgDiscussionColumns({
        onOpenDiscussion: openDiscussion,
        formatDate: formatDateToDMY,
        labels: {
          title: t("admin-discussions:columns.title"),
          author: t("admin-discussions:columns.author"),
          status: t("admin-discussions:columns.status"),
          date: t("admin-discussions:columns.date"),
          messages: t("admin-discussions:columns.messages"),
          createdAt: t("admin-discussions:columns.createdDate"),
          closedAt: t("admin-discussions:columns.closedDate"),
          open: t("admin-discussions:filters.status.open"),
          closed: t("admin-discussions:filters.status.closed"),
        },
      }),
    [openDiscussion, t]
  );

  const pageTitle = pageContent.orgHero?.title ?? "";

  // One request with page_size = the total the table already received.
  const handleDownloadCsv = useCallback(async () => {
    const response = await fetchScopedDiscussions(orgId, 1, totalItems, {
      q: searchQuery.trim() || undefined,
      closed: filters.closedFilter === "" ? undefined : filters.closedFilter === "closed",
      sort: sortParam,
    });
    const allDiscussions = response.data ?? [];
    // The fetchers return an empty page on error.
    if (totalItems > 0 && allDiscussions.length === 0) {
      throw new Error(t("admin-common:csvExport.fetchError"));
    }
    downloadListCsv(pageTitle || t("admin-discussions:title"), allDiscussions, columns);
  }, [
    downloadListCsv,
    columns,
    fetchScopedDiscussions,
    filters.closedFilter,
    orgId,
    pageTitle,
    searchQuery,
    sortParam,
    t,
    totalItems,
  ]);

  return (
    <AdminListPage
      breadcrumbItems={[{ label: t("admin-discussions:title") }]}
      title={pageTitle}
      description={pageContent.orgHero?.description?.trim() || t("admin-discussions:description")}
      headerAction={null}
      introClassName="mb-32"
      breadcrumbClassName="xl:[&_li]:min-h-[44px] xl:[&_li]:items-center xl:[&_li:first-child]:border-b-2 xl:[&_li:first-child]:border-neutral-900"
      headerInfoClassName="max-w-[592px] gap-16"
      descriptionClassName="text-m-regular text-brand-blue-secondary"
      resultsTitle={<span className="text-neutral-900">{t("admin-discussions:resultsTitle")}</span>}
      tableClassName="xl:table-fixed"
      beforeList={
        <ToggleGroup
          id="discussion-scope"
          className="[&_.agora-toggle]:h-[60px] [&_.agora-toggle]:py-[14px]"
          aria-label={t("admin-discussions:tabs.label")}
          variant="primary"
          appearance="button"
          orientation="horizontal"
          fullWidth
          multiple={false}
          value={filters.scope}
          onChange={(values) => {
            const scope = values[0];
            if (!scope || scope === filters.scope) return;
            // Replace any pending search so it cannot carry over to the next scope.
            handleSearch("");
            setSearchQuery("");
            setSearchInput("");
            setIsLoading(true);
            setDiscussions([]);
            setTotalItems(0);
            updateFilter("scope", scope);
          }}
        >
          <Toggle value="organization">{t("admin-discussions:tabs.organization")}</Toggle>
          <Toggle value="content">{t("admin-discussions:tabs.content")}</Toggle>
        </ToggleGroup>
      }
      isLoading={isLoading}
      count={totalItems}
      currentPage={currentPage}
      pageSize={pageSize}
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
      hasActiveFilters={Boolean(searchInput.trim() || searchQuery.trim() || filters.closedFilter)}
      toolbar={
        <DiscussionsFilters
          searchValue={searchInput}
          appliedSearch={searchQuery}
          status={filters.closedFilter}
          onSearchChange={(value) => {
            setSearchInput(value);
            handleSearch(value);
          }}
          onClearSearch={() => {
            handleSearch("");
            setSearchQuery("");
            setSearchInput("");
            setCurrentPage(1);
          }}
          onStatusChange={(value) => updateFilter("closedFilter", value)}
          onClear={() => {
            handleSearch("");
            setSearchQuery("");
            setSearchInput("");
            updateFilter("closedFilter", "");
          }}
        />
      }
      emptyState={
        <AdminEmptyState
          icon="agora-line-chat"
          title={pageContent.orgNoResults?.title ?? ""}
          description={
            filters.scope === "organization"
              ? t("admin-discussions:empty.descriptionOrganization")
              : (pageContent.orgNoResults?.description ?? "")
          }
        />
      }
      onDownloadCsv={handleDownloadCsv}
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
