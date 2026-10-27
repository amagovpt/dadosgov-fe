"use client";

import { useState } from "react";
import type { ChangeEvent, ComponentProps, ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import {
  Tab,
  TabBody,
  TabHeader,
  Table,
  Tabs,
  useToastContext,
} from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";
import AdminLayout from "@/components/Layout/AdminLayout";
import type { AdminLayoutProps } from "@/components/Layout/AdminLayout";
import ResultsCount from "@/components/admin/ResultsCount";
import type { CreatePaginationPropsOptions } from "@/utils/createPaginationProps";
import { useHasListData } from "@/hooks/admin-lists/useHasListData";
import AdminPaginatedTable from "./AdminPaginatedTable";
import { AdminSearch, AdminSearchBar } from "./AdminSearch";
import Button from "@/components/Primitives/Button";
import { useApiErrorHandler } from "@/providers/ApiErrorProvider";

const TOAST_DURATION_MS = 10000;

type SearchConfig = {
  appearance?: "input" | "bar";
  label?: string;
  placeholder: string;
  ariaLabel?: string;
  hint?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
};

interface AdminListPageProps extends Pick<
  AdminLayoutProps,
  | "introClassName"
  | "breadcrumbClassName"
  | "titleClassName"
  | "descriptionClassName"
  | "kickerClassName"
> {
  className?: AdminLayoutProps["className"];
  title: string;
  kicker?: string;
  description?: string;
  listTitle?: string;
  listTitleClassName?: string;
  tableClassName?: string;
  breadcrumbItems: AdminLayoutProps["breadcrumbItems"];
  headerAction?: ReactNode;
  headerClassName?: AdminLayoutProps["headerClassName"];
  headerInfoClassName?: AdminLayoutProps["headerInfoClassName"];
  beforeList?: ReactNode;
  tabs?: {
    labels: string[];
    activeTab: number;
    onTabActivation: (index: number) => void;
  };
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
  showResultsSummary?: boolean;
  paginationOptions?: CreatePaginationPropsOptions;
  /** Shows the table download action. */
  onDownloadCsv?: () => Promise<void>;
}

export default function AdminListPage({
  className,
  title,
  kicker,
  description,
  listTitle,
  listTitleClassName,
  tableClassName,
  breadcrumbItems,
  headerAction,
  headerClassName,
  headerInfoClassName,
  introClassName,
  breadcrumbClassName,
  titleClassName,
  descriptionClassName,
  kickerClassName,
  beforeList,
  tabs,
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
  showResultsSummary = true,
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

  const listContent = (
    <>
      {listTitle && (
        <h2
          className={`text-xl-bold ${twMerge("mb-32 text-brand-blue-secondary", listTitleClassName)}`}
        >
          {listTitle}
        </h2>
      )}
      {shouldRenderToolbar && (
        <div className="flex flex-col gap-32">
          {visibleFilters}
          {(visibleSearch || toolbarActions) && (
            <div className="flex flex-wrap items-end justify-between gap-16">
              {visibleSearch && (
                <div className="admin-search-wrapper w-full max-w-[592px]">
                  {visibleSearch.appearance === "bar" ? (
                    <AdminSearchBar
                      hasVoiceActionButton={false}
                      defaultValue={visibleSearch.defaultValue}
                      label={visibleSearch.label}
                      placeholder={visibleSearch.placeholder}
                      aria-label={
                        visibleSearch.ariaLabel ?? visibleSearch.label ?? visibleSearch.placeholder
                      }
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        visibleSearch.onChange?.(event.target.value)
                      }
                    />
                  ) : (
                    <AdminSearch
                      required={false}
                      defaultValue={visibleSearch.defaultValue}
                      label={visibleSearch.label}
                      placeholder={visibleSearch.placeholder}
                      aria-label={
                        visibleSearch.ariaLabel ?? visibleSearch.label ?? visibleSearch.placeholder
                      }
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        visibleSearch.onChange?.(e.target.value);
                      }}
                    />
                  )}
                </div>
              )}

              {toolbarActions && <div className="flex flex-wrap gap-16">{toolbarActions}</div>}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-16">
        {feedback}

        {showListControls && (showResultsSummary || canDownloadCsv) && (
          <div className="flex flex-wrap items-center justify-between gap-16">
            {showResultsSummary && (
              <div className="flex flex-col gap-8">
                <h2 className="text-l-medium text-primary-900">{t("resultsTitle")}</h2>
                {resultsCount ?? (
                  <ResultsCount count={count} isLoading={isInitialLoading} className="mb-0" />
                )}
              </div>
            )}

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
          // Agora's closed pagination dropdown extends 8px below its trigger.
          <div
            aria-busy={isRefreshing}
            className="-mb-8 flex flex-col gap-16 overflow-x-auto pb-8 xl:overflow-hidden [&_.agora-table-pagination]:w-full!"
          >
            <AdminPaginatedTable
              tableClassName={tableClassName}
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
    </>
  );

  return (
    <AdminLayout
      className={className}
      headerClassName={headerClassName}
      headerInfoClassName={headerInfoClassName}
      introClassName={introClassName}
      breadcrumbClassName={breadcrumbClassName}
      titleClassName={titleClassName}
      descriptionClassName={descriptionClassName}
      kickerClassName={kickerClassName}
      title={title}
      kicker={kicker}
      description={description}
      breadcrumbItems={breadcrumbItems}
      headerAction={headerAction}
    >
      {beforeList}
      {tabs ? (
        <Tabs
          className="[&_.tab-panel-content]:pt-32 [&_.tab-panel-content]:pb-0"
          onTabActivation={tabs.onTabActivation}
        >
          {tabs.labels.map((label, index) => (
            <Tab key={label} active={tabs.activeTab === index}>
              <TabHeader>{label}</TabHeader>
              <TabBody>
                {tabs.activeTab === index && (
                  <div className="mt-32 flex flex-col gap-32">{listContent}</div>
                )}
              </TabBody>
            </Tab>
          ))}
        </Tabs>
      ) : (
        listContent
      )}
    </AdminLayout>
  );
}
