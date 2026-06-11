"use client";

import { Icon } from "@ama-pt/agora-design-system";
import TextLink from "@/components/Primitives/TextLink";
import AdminListTable, { type AdminListColumn } from "@/components/admin/lists/AdminListTable";
import AdminPaginatedTable from "@/components/admin/lists/AdminPaginatedTable";
import type { Dataset } from "@/service/types/dataset";

const PAGE_SIZE = 10;

const columns: AdminListColumn<Dataset>[] = [
  {
    id: "title",
    header: "TÍTULO DO CONJUNTO DE DADOS",
    headerLabel: "Título",
    renderCell: (dataset) => <TextLink href={dataset.page}>{dataset.title}</TextLink>,
  },
  {
    id: "discussions",
    header: <Icon name="agora-line-chat" className="h-16 w-16" />,
    headerLabel: "Discussões",
    renderCell: (dataset) => dataset.metrics?.discussions ?? 0,
  },
  {
    id: "views",
    header: <Icon name="agora-line-eye" className="h-16 w-16" />,
    headerLabel: "Visualizações",
    renderCell: (dataset) => dataset.metrics?.views ?? 0,
  },
  {
    id: "downloads",
    header: <Icon name="agora-line-download" className="h-16 w-16" />,
    headerLabel: "Downloads",
    renderCell: (dataset) => dataset.metrics?.resources_downloads ?? 0,
  },
  {
    id: "reuses",
    header: <img src="/Icons/bar_chart.svg" alt="Reutilizações" className="h-16 w-16" />,
    headerLabel: "Reutilizações",
    renderCell: (dataset) => dataset.metrics?.reuses ?? 0,
  },
  {
    id: "followers",
    header: <Icon name="agora-line-star" className="h-16 w-16" />,
    headerLabel: "Favoritos",
    renderCell: (dataset) => dataset.metrics?.followers ?? 0,
  },
];

interface DatasetMetricsTableProps {
  datasets: Dataset[];
  total: number;
  page: number;
  onPageChange: (page: number) => void;
}

export function DatasetMetricsTable({
  datasets,
  total,
  page,
  onPageChange,
}: DatasetMetricsTableProps) {
  return (
    <AdminPaginatedTable
      pageSize={PAGE_SIZE}
      totalItems={total}
      currentPage={page}
      setCurrentPage={onPageChange}
    >
      <AdminListTable items={datasets} columns={columns} getRowKey={(dataset) => dataset.id} />
    </AdminPaginatedTable>
  );
}
