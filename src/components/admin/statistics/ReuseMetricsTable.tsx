"use client";

import { Icon } from "@ama-pt/agora-design-system";
import TextLink from "@/components/Primitives/TextLink";
import AdminListTable, { type AdminListColumn } from "@/components/admin/lists/AdminListTable";
import AdminPaginatedTable from "@/components/admin/lists/AdminPaginatedTable";
import type { Reuse } from "@/service/types/reuse";

const PAGE_SIZE = 10;

const columns: AdminListColumn<Reuse>[] = [
  {
    id: "title",
    header: "TÍTULO DA REUTILIZAÇÃO",
    headerLabel: "Título",
    renderCell: (reuse) => <TextLink href={reuse.url} target="_blank">{reuse.title}</TextLink>,
  },
  {
    id: "views",
    header: <Icon name="agora-line-eye" className="h-16 w-16" />,
    headerLabel: "Visualizações",
    renderCell: (reuse) => reuse.metrics?.views ?? 0,
  },
  {
    id: "followers",
    header: <Icon name="agora-line-star" className="h-16 w-16" />,
    headerLabel: "Favoritos",
    renderCell: (reuse) => reuse.metrics?.followers ?? 0,
  },
  {
    id: "status",
    header: "ESTADO",
    headerLabel: "Estado",
    renderCell: (reuse) => (reuse.private ? "Privado" : reuse.archived ? "Arquivado" : "Público"),
  },
];

interface ReuseMetricsTableProps {
  reuses: Reuse[];
  total: number;
  page: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
}

export function ReuseMetricsTable({
  reuses,
  total,
  page,
  onPageChange,
  pageSize = PAGE_SIZE,
  onPageSizeChange,
}: ReuseMetricsTableProps) {
  return (
    <AdminPaginatedTable
      pageSize={pageSize}
      totalItems={total}
      currentPage={page}
      setCurrentPage={onPageChange}
      setPageSize={onPageSizeChange}
    >
      <AdminListTable items={reuses} columns={columns} getRowKey={(reuse) => reuse.id} />
    </AdminPaginatedTable>
  );
}
