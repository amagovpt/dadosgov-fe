"use client";

import type { ChangeEvent, ComponentProps, ReactNode } from "react";
import { InputSearchBar, Table } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";
import AdminLayout from "@/components/Layout/AdminLayout";
import type { AdminLayoutProps } from "@/components/Layout/AdminLayout";
import ResultsCount from "@/components/admin/ResultsCount";
import type { CreatePaginationPropsOptions } from "@/utils/createPaginationProps";
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
  breadcrumbItems: AdminLayoutProps["breadcrumbItems"];
  headerAction?: ReactNode;
  isLoading: boolean;
  count: number;
  hasItems?: boolean;
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
  breadcrumbItems,
  headerAction,
  isLoading,
  count,
  hasItems,
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
  const shouldRenderToolbar = Boolean(search || filters || toolbarActions);
  const shouldRenderTable = hasItems ?? count > 0;
  const defaultLoadingContent = <p className="text-sm text-neutral-700">{t("loading")}</p>;

  return (
    <AdminLayout title={title} breadcrumbItems={breadcrumbItems} headerAction={headerAction}>
      {resultsCount ?? <ResultsCount count={count} isLoading={isLoading} />}

      {shouldRenderToolbar && (
        <div className="mb-24 flex items-end gap-16">
          {search && (
            <div className="admin-search-wrapper">
              <InputSearchBar
                hasVoiceActionButton={false}
                label={search.label ?? t("search.label")}
                placeholder={search.placeholder}
                aria-label={search.ariaLabel ?? search.label ?? search.placeholder}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  search.onChange?.(e.target.value);
                }}
              />
            </div>
          )}
          {filters}
          {toolbarActions}
        </div>
      )}

      {feedback}

      {isLoading ? (
        loadingContent ?? defaultLoadingContent
      ) : shouldRenderTable ? (
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
      ) : (
        emptyState
      )}
    </AdminLayout>
  );
}
