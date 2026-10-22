"use client";

import { useState } from "react";
import type { ChangeEvent, ComponentProps, ReactNode } from "react";
import { InputSearch, Table, useToastContext } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";
import AdminLayout from "@/components/Layout/AdminLayout";
import type { AdminLayoutProps } from "@/components/Layout/AdminLayout";
import ResultsCount from "@/components/admin/ResultsCount";
import type { CreatePaginationPropsOptions } from "@/utils/createPaginationProps";
import { useHasListData } from "@/hooks/admin-lists/useHasListData";
import AdminPaginatedTable from "./AdminPaginatedTable";
import Button from "@/components/Primitives/Button";
import { useApiErrorHandler } from "@/providers/ApiErrorProvider";

const TOAST_DURATION_MS = 10000;

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
  /** Shows the table download action. */
  onDownloadCsv?: () => Promise<void>;
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
  onDownloadCsv,
}: AdminListPageProps) {
  const { t } = useTranslation("admin-common");
  const { showToast } = useToastContext();
  const { hasNotifiedSince } = useApiErrorHandler();
  const shouldRenderTable = hasItems ?? count > 0;
  const showListControls = useHasListData(
    isLoading,
    count > 0 || shouldRenderTable,
    hasActiveFilters
  );
  const visibleSearch = showListControls ? search : undefined;
  const visibleFilters = showListControls ? filters : undefined;
  const canDownloadCsv = Boolean(onDownloadCsv) && showListControls;
  const shouldRenderToolbar = Boolean(visibleSearch || visibleFilters || toolbarActions);
  const [isDownloadingCsv, setIsDownloadingCsv] = useState(false);
  const isDownloadCsvDisabled = isDownloadingCsv || !shouldRenderTable;
  const defaultLoadingContent = <p className="text-sm text-neutral-700">{t("loading")}</p>;
  const isInitialLoading = isLoading && !shouldRenderTable;
  const isRefreshing = isLoading && shouldRenderTable;

  const handleDownloadCsv = async () => {
    if (!onDownloadCsv || isDownloadCsvDisabled) return;
    setIsDownloadingCsv(true);
    const startedAt = Date.now();
    try {
      await onDownloadCsv();
    } catch (error) {
      console.error("Error downloading CSV:", error);
      // The global API error handler already told the user about this failure.
      if (hasNotifiedSince(startedAt)) return;
      showToast(
        {
          id: crypto.randomUUID(),
          type: "failure",
          title: t("csvExport.errorTitle"),
          description: t("csvExport.errorDescription"),
          closeLabel: t("csvExport.close"),
        },
        TOAST_DURATION_MS
      );
    } finally {
      setIsDownloadingCsv(false);
    }
  };

  return (
    <AdminLayout
      title={title}
      kicker={kicker}
      description={description}
      breadcrumbItems={breadcrumbItems}
      headerAction={headerAction}
    >
      {listTitle && <h2 className="mb-32 text-xl-bold text-brand-blue-secondary">{listTitle}</h2>}
      {shouldRenderToolbar && (
        <div className="flex flex-col gap-32">
          {visibleFilters}
          {(visibleSearch || toolbarActions) && (
            <div className="flex flex-wrap items-end justify-between gap-16">
              {visibleSearch && (
                <div className="w-full max-w-[592px]">
                  <InputSearch
                    required={false}
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

              {toolbarActions && <div className="flex flex-wrap gap-16">{toolbarActions}</div>}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-16">
        {feedback}

        {showListControls && (
          <div className="flex flex-wrap items-center justify-between gap-16">
            <div className="flex flex-col gap-8">
              <h2 className="text-l-medium text-primary-900">{t("resultsTitle")}</h2>
              {resultsCount ?? (
                <ResultsCount count={count} isLoading={isInitialLoading} className="mb-0" />
              )}
            </div>

            {canDownloadCsv && (
              <Button
                className="ml-auto"
                variant="primary"
                appearance="link"
                hasIcon
                leadingIcon="agora-line-download"
                leadingIconHover="agora-solid-download"
                disabled={isDownloadCsvDisabled}
                aria-busy={isDownloadingCsv}
                onClick={handleDownloadCsv}
              >
                {isDownloadingCsv ? t("actions.downloadingCsv") : t("actions.downloadCsv")}
              </Button>
            )}
          </div>
        )}

        {isInitialLoading ? (
          (loadingContent ?? defaultLoadingContent)
        ) : shouldRenderTable ? (
          <div
            aria-busy={isRefreshing}
            className="flex flex-col gap-16 overflow-auto xl:overflow-hidden [&_.agora-table-pagination]:w-full!"
          >
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
      </div>
    </AdminLayout>
  );
}
