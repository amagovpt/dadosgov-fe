"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Toggle, ToggleGroup, usePopupContext } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";
import DiscussionsFilters from "./DiscussionsFilters";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import { useAdminListController } from "@/hooks/admin-lists/useAdminListController";
import {
  fetchDiscussions,
  fetchOrgDiscussions,
  fetchUserDiscussions,
} from "@/service/api/discussions-topics";
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
import Button from "@/components/Primitives/Button";

type DiscussionsListClientProps =
  | { scope: "organization"; orgId: string; userId?: never; pageContent: BoDiscussionsPage }
  | { scope: "personal"; userId: string; orgId?: never; pageContent?: never };

export default function DiscussionsListClient({
  scope,
  orgId,
  userId,
  pageContent,
}: DiscussionsListClientProps) {
  const { t } = useTranslation(["admin-common", "admin-discussions"]);
  const downloadListCsv = useCsvExport();
  const { show } = usePopupContext();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const refreshDiscussions = useCallback(() => {
    setRefreshVersion((version) => version + 1);
  }, []);
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
  const fetchDiscussionPage = useCallback(
    async (page: number, size: number) => {
      const query = {
        q: searchQuery.trim() || undefined,
        closed: filters.closedFilter === "" ? undefined : filters.closedFilter === "closed",
        sort: sortParam,
      };
      if (scope === "personal") {
        return fetchUserDiscussions(userId, page, size, query);
      }
      const fetchPage = filters.scope === "organization" ? fetchDiscussions : fetchOrgDiscussions;
      return fetchPage(orgId, page, size, query);
    },
    [scope, userId, orgId, filters.scope, filters.closedFilter, searchQuery, sortParam]
  );

  useEffect(() => {
    let cancelled = false;
    async function loadDiscussions() {
      setIsLoading(true);
      setLoadError(false);
      try {
        const data = await fetchDiscussionPage(currentPage, pageSize);
        if (!cancelled) {
          const lastPage = Math.max(1, Math.ceil((data.total ?? 0) / pageSize));
          if (currentPage > lastPage) {
            setCurrentPage(lastPage);
            return;
          }
          setDiscussions(data.data ?? []);
          setTotalItems(data.total ?? 0);
        }
      } catch (error) {
        console.error("Error loading discussions:", error);
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadDiscussions();
    return () => {
      cancelled = true;
    };
  }, [fetchDiscussionPage, currentPage, pageSize, refreshVersion, setCurrentPage]);

  const openDiscussion = useCallback(
    (discussion: Discussion) => {
      show(
        <DiscussionDetailPopup
          key={discussion.id}
          discussion={discussion}
          onUpdated={refreshDiscussions}
          onDeleted={refreshDiscussions}
        />,
        {
          title: t("admin-discussions:popup.title"),
          closeAriaLabel: t("admin-common:deleteAccount.closeAriaLabel"),
          dimensions: "l",
        }
      );
    },
    [show, t, refreshDiscussions]
  );

  const columns = useMemo(() => {
    const contentTypeLabels: Record<string, string> = {
      Dataset: t("admin-discussions:contentTypes.dataset"),
      Reuse: t("admin-discussions:contentTypes.reuse"),
      Dataservice: t("admin-discussions:contentTypes.dataservice"),
      Organization: t("admin-discussions:contentTypes.organization"),
    };

    return createOrgDiscussionColumns({
      onOpenDiscussion: openDiscussion,
      formatDate: formatDateToDMY,
      contentTypeColumn:
        scope === "personal" || filters.scope === "content"
          ? {
              label: t("admin-discussions:columns.contentType"),
              getValue: (discussion) =>
                contentTypeLabels[discussion.subject?.class] ??
                t("admin-discussions:contentTypes.unknown"),
            }
          : undefined,
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
    });
  }, [openDiscussion, t, filters.scope, scope]);

  const pageTitle =
    scope === "personal"
      ? t("admin-discussions:personal.title")
      : (pageContent?.orgHero?.title ?? "");
  const hasActiveFilters = Boolean(
    searchInput.trim() || searchQuery.trim() || filters.closedFilter
  );

  // One request with page_size
  const handleDownloadCsv = useCallback(async () => {
    const response = await fetchDiscussionPage(1, totalItems);
    const allDiscussions = response.data ?? [];
    // The fetchers return an empty page on error.
    if (totalItems > 0 && allDiscussions.length === 0) {
      throw new Error(t("admin-common:csvExport.fetchError"));
    }
    downloadListCsv(pageTitle || t("admin-discussions:title"), allDiscussions, columns);
  }, [downloadListCsv, columns, fetchDiscussionPage, pageTitle, t, totalItems]);

  return (
    <AdminListPage
      breadcrumbItems={[{ label: t("admin-discussions:title") }]}
      title={pageTitle}
      description={
        scope === "personal"
          ? t("admin-discussions:personal.description")
          : pageContent?.orgHero?.description?.trim() || t("admin-discussions:description")
      }
      headerAction={null}
      introClassName="mb-32"
      breadcrumbClassName="xl:[&_li]:min-h-[44px] xl:[&_li]:items-center xl:[&_li:first-child]:border-b-2 xl:[&_li:first-child]:border-neutral-900"
      headerInfoClassName="max-w-[592px] gap-16"
      descriptionClassName="text-m-regular text-brand-blue-secondary"
      resultsTitle={<span className="text-neutral-900">{t("admin-discussions:resultsTitle")}</span>}
      tableClassName="xl:table-fixed"
      beforeList={
        scope === "organization" ? (
          <ToggleGroup
            id="discussion-scope"
            className="[&_.agora-toggle]:h-auto [&_.agora-toggle]:min-h-[60px] [&_.agora-toggle]:min-w-0! [&_.agora-toggle]:self-stretch [&_.agora-toggle]:py-[14px] [&_.children-content]:min-w-0 [&_.children-content]:[overflow-wrap:anywhere]"
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
              setIsLoading(true);
              setDiscussions([]);
              setTotalItems(0);
              updateFilter("scope", scope);
            }}
          >
            <Toggle value="organization">{t("admin-discussions:tabs.organization")}</Toggle>
            <Toggle value="content">{t("admin-discussions:tabs.content")}</Toggle>
          </ToggleGroup>
        ) : undefined
      }
      isLoading={isLoading}
      count={totalItems}
      currentPage={currentPage}
      pageSize={pageSize}
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
      hasActiveFilters={hasActiveFilters}
      feedback={
        loadError && (
          <div role="alert" className="flex flex-col items-start gap-16">
            <p>{t("admin-discussions:loadError")}</p>
            <Button variant="primary" appearance="outline" onClick={refreshDiscussions}>
              {t("admin-discussions:retry")}
            </Button>
          </div>
        )
      }
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
        !loadError && (
          <AdminEmptyState
            icon="agora-line-chat"
            title={
              scope === "personal"
                ? t(
                    hasActiveFilters
                      ? "admin-discussions:personal.noResultsTitle"
                      : "admin-discussions:personal.emptyTitle"
                  )
                : (pageContent?.orgNoResults?.title ?? "")
            }
            description={
              scope === "personal"
                ? t(
                    hasActiveFilters
                      ? "admin-discussions:personal.noResultsDescription"
                      : "admin-discussions:personal.emptyDescription"
                  )
                : filters.scope === "organization"
                  ? t("admin-discussions:empty.descriptionOrganization")
                  : (pageContent?.orgNoResults?.description ?? "")
            }
          />
        )
      }
      onDownloadCsv={handleDownloadCsv}
    >
      <AdminListTable
        items={discussions}
        columns={columns}
        getSortOrder={getSortOrder}
        handleSort={handleSort}
        getRowKey={(discussion) => discussion.id}
      />
    </AdminListPage>
  );
}
