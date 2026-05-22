import { ReactNode } from "react";
import { Table } from "@ama-pt/agora-design-system";
import { createPaginationProps } from "@/utils/createPaginationProps";

interface AdminPaginatedTableProps {
  children: ReactNode;
  pageSize: number;
  totalItems: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
}

export default function AdminPaginatedTable({
  children,
  pageSize,
  totalItems,
  currentPage,
  setCurrentPage,
  setPageSize,
}: AdminPaginatedTableProps) {
  return (
    <Table
      paginationProps={createPaginationProps(
        pageSize,
        totalItems,
        currentPage,
        setCurrentPage,
        setPageSize
      )}
    >
      {children}
    </Table>
  );
}
