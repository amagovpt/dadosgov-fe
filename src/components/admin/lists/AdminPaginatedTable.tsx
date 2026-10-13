"use client";

import type { ComponentProps } from "react";
import { Table } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";
import type { CreatePaginationPropsOptions } from "@/utils/createPaginationProps";
import { createPaginationProps } from "@/utils/createPaginationProps";
import styles from "./AdminPaginatedTable.module.css";

interface AdminPaginatedTableProps {
  children: ComponentProps<typeof Table>["children"];
  pageSize: number;
  totalItems: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  setPageSize?: (pageSize: number) => void;
  paginationOptions?: CreatePaginationPropsOptions;
  showPaginationSummary?: boolean;
}

export default function AdminPaginatedTable({
  children,
  pageSize,
  totalItems,
  currentPage,
  setCurrentPage,
  setPageSize,
  paginationOptions,
  showPaginationSummary = false,
}: AdminPaginatedTableProps) {
  const { t } = useTranslation("admin-common");

  const paginationProps = createPaginationProps(
    pageSize,
    totalItems,
    currentPage,
    setCurrentPage,
    setPageSize,
    {
      itemsPerPageLabel: `${t("pagination.itemsPerPage")}${showPaginationSummary ? ":" : ""}`,
      buttonDropdownAriaLabel: t("pagination.selectItemsPerPage"),
      dropdownListAriaLabel: t("pagination.itemsPerPageOptions"),
      prevButtonAriaLabel: t("pagination.previous"),
      nextButtonAriaLabel: t("pagination.next"),
      ...paginationOptions,
    }
  );

  const table = <Table paginationProps={paginationProps}>{children}</Table>;

  if (!showPaginationSummary) return table;

  const start = totalItems > 0 ? Math.min((currentPage - 1) * pageSize + 1, totalItems) : 0;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={styles.tableWithSummary}>
      {table}
      <span className={styles.range} role="status">
        {t("pagination.range", { start, end, count: totalItems })}
      </span>
    </div>
  );
}
