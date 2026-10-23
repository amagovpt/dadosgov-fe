"use client";

import type { ComponentProps } from "react";
import { Table } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";
import type { CreatePaginationPropsOptions } from "@/utils/createPaginationProps";
import { createPaginationProps } from "@/utils/createPaginationProps";

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
    <div
      className={[
        "grid grid-cols-[minmax(0,1fr)_auto] bg-white text-neutral-700 md:grid-cols-[minmax(0,1fr)_auto_auto]",
        "[&_.agora-table-pagination]:contents! [&>.agora-table]:contents! [&>.agora-table>table]:col-span-full [&>.agora-table>table]:row-start-1",
        "[&_.section-items]:col-span-full [&_.section-items]:row-start-2 [&_.section-items]:border-x-2 [&_.section-items]:border-b-0 [&_.section-items]:border-neutral-200 md:[&_.section-items]:col-span-1 md:[&_.section-items]:col-start-1 md:[&_.section-items]:border-r-0 md:[&_.section-items]:border-b-2",
        "[&_.section-items>button]:h-64 [&_.section-items>button]:text-m-regular [&_.section-items>button_.children-wrapper]:font-normal!",
        "[&_.action-buttons]:col-start-2 [&_.action-buttons]:row-start-3 [&_.action-buttons]:border-y-2 [&_.action-buttons]:border-r-2 [&_.action-buttons]:border-neutral-200 md:[&_.action-buttons]:col-start-3 md:[&_.action-buttons]:row-start-2 md:[&_.action-buttons]:border-t-0",
        "[&_.action-buttons_button]:size-64! [&_.action-buttons_button]:min-h-64 [&_.action-buttons_button]:min-w-64 [&_.action-buttons_button]:border-0 [&_.action-buttons_button]:p-[10px]",
      ].join(" ")}
    >
      {table}
      <span
        className="col-start-1 row-start-3 flex items-center border-y-2 border-l-2 border-neutral-200 px-16 py-[10px] text-s-regular whitespace-nowrap md:col-start-2 md:row-start-2 md:border-t-0"
        role="status"
      >
        {t("pagination.range", { start, end, count: totalItems })}
      </span>
    </div>
  );
}
