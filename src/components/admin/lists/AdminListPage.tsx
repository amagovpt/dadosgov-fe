"use client";

import type { ChangeEvent, ComponentProps, ReactNode } from "react";
import { InputSearchBar, Table } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";
import AdminLayout from "@/components/Layout/AdminLayout";
import type { AdminLayoutProps } from "@/components/Layout/AdminLayout";
import ResultsCount from "@/components/admin/ResultsCount";
import type { CreatePaginationPropsOptions } from "@/utils/createPaginationProps";
import { useHasListData } from "@/hooks/admin-lists/useHasListData";
import AdminPaginatedTable from "./AdminPaginatedTable";

type SearchConfig = {
  label?: string;
  placeholder: string;
  ariaLabel?: string;
  hint?: string;
  onChange?: (value: string) => void;
};

interface AdminListPageProps {
  title: string;
  kicker?: string;
  description?: string;
  listTitle?: string;
  breadcrumbItems: AdminLayoutProps["breadcrumbItems"];
  headerAction?: ReactNode;
  isLoading: boolean;
  count: number;
  hasItems?: boolean;
  /** Keeps search/filters visible when a pre-set filter (e.g. from the URL) matches nothing. */
  hasActiveFilters?: boolean;
  currentPage: number;
  pageSize: number;
  setCurrentPage: (page: number) => void;
  setPageSize?: (pageSize: number) => void;
  search?: SearchConfig;
  filters?: ReactNode;
  toolbarActions?: ReactNode;
  feedback?: ReactNode;
  emptyState: ReactNode;
  children: ComponentProps<typeof Table>["children"];
  loadingContent?: ReactNode;
  resultsCount?: ReactNode;
  paginationOptions?: CreatePaginationPropsOptions;
}

export default function AdminListPage({
  title,
  kicker,
  description,
  listTitle,
  breadcrumbItems,
  headerAction,
  isLoading,
  count,
  hasItems,
  hasActiveFilters = false,
  currentPage,
  pageSize,
  setCurrentPage,
  setPageSize,
  search,
  filters,
  toolbarActions,
  feedback,
  emptyState,
  children,
  loadingContent,
  resultsCount,
  paginationOptions,
}: AdminListPageProps) {
  const { t } = useTranslation("admin-common");
  const shouldRenderTable = hasItems ?? count > 0;
  const showListControls = useHasListData(
    isLoading,
    count > 0 || shouldRenderTable,
    hasActiveFilters
  );
  const visibleSearch = showListControls ? search : undefined;
  const visibleFilters = showListControls ? filters : undefined;
  const shouldRenderToolbar = Boolean(visibleSearch || visibleFilters || toolbarActions);
  const defaultLoadingContent = <p className="text-sm text-neutral-700">{t("loading")}</p>;
  const isInitialLoading = isLoading && !shouldRenderTable;
  const isRefreshing = isLoading && shouldRenderTable;

  return (
    <AdminLayout
      title={title}
      kicker={kicker}
      description={description}
      breadcrumbItems={breadcrumbItems}
      headerAction={headerAction}
    >
      {listTitle && (
        <h2 className="text-xl-bold text-brand-blue-secondary mb-32">{listTitle}</h2>
      )}
      {/* {resultsCount ?? <ResultsCount count={count} isLoading={isInitialLoading} />} */}

      {shouldRenderToolbar && (
        <div className="flex flex-col gap-32">
          {visibleFilters}
          {(visibleSearch || toolbarActions) && (
            <div className="flex items-end gap-16">
              {visibleSearch && (
                <div className="admin-search-wrapper xl:w-1/2 w-full">
                  <InputSearchBar
                    hasVoiceActionButton={false}
                    label={visibleSearch.label}
                    placeholder={visibleSearch.placeholder}
                    aria-label={
                      visibleSearch.ariaLabel ?? visibleSearch.label ?? visibleSearch.placeholder
                    }
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      visibleSearch.onChange?.(e.target.value);
                    }}
                  />
                </div>
              )}
              {toolbarActions}
            </div>
          )}
        </div>
      )}

      {feedback}

      {isInitialLoading ? (
        loadingContent ?? defaultLoadingContent
      ) : shouldRenderTable ? (
        <div aria-busy={isRefreshing} className="flex flex-col gap-16 overflow-auto xl:overflow-hidden [&_.agora-table-pagination]:w-full!">
          <AdminPaginatedTable
            pageSize={pageSize}
            totalItems={count}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            setPageSize={setPageSize}
            paginationOptions={paginationOptions}
          >
            {children}
          </AdminPaginatedTable>
        </div>
      ) : (
        emptyState
      )}
    </AdminLayout>
  );
}
