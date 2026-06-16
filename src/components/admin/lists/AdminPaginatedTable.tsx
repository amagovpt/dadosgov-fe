import type { ComponentProps } from "react";
import { Table } from "@ama-pt/agora-design-system";
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
  return (
    <Table
      paginationProps={createPaginationProps(
        pageSize,
        totalItems,
        currentPage,
        setCurrentPage,
        setPageSize,
        paginationOptions
      )}
    >
      {children}
    </Table>
  );
}
