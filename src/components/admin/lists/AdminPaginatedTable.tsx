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
}

export default function AdminPaginatedTable({
  children,
  pageSize,
  totalItems,
  currentPage,
  setCurrentPage,
  setPageSize,
  paginationOptions,
}: AdminPaginatedTableProps) {
  const { t } = useTranslation("admin-common");

  return (
    <Table
      paginationProps={createPaginationProps(
        pageSize,
        totalItems,
        currentPage,
        setCurrentPage,
        setPageSize,
        {
          itemsPerPageLabel: t("pagination.itemsPerPage"),
          buttonDropdownAriaLabel: t("pagination.selectItemsPerPage"),
          dropdownListAriaLabel: t("pagination.itemsPerPageOptions"),
          prevButtonAriaLabel: t("pagination.previous"),
          nextButtonAriaLabel: t("pagination.next"),
          ...paginationOptions,
        }
      )}
    >
      {children}
    </Table>
  );
}
