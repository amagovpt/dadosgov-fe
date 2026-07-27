"use client";

import { useTranslation } from "react-i18next";
import { Icon } from "@ama-pt/agora-design-system";
import TextLink from "@/components/Primitives/TextLink";
import AdminListTable, { type AdminListColumn } from "@/components/admin/lists/AdminListTable";
import AdminPaginatedTable from "@/components/admin/lists/AdminPaginatedTable";
import type { Dataset } from "@/service/types/dataset";

const PAGE_SIZE = 10;

interface DatasetMetricsTableProps {
  datasets: Dataset[];
  total: number;
  page: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
}

export function DatasetMetricsTable({
  datasets,
  total,
  page,
  onPageChange,
  pageSize = PAGE_SIZE,
  onPageSizeChange,
}: DatasetMetricsTableProps) {
  const { t } = useTranslation("admin-statistics");

  const columns: AdminListColumn<Dataset>[] = [
    {
      id: "title",
      header: t("table.datasetTitle"),
      headerLabel: t("table.title"),
      renderCell: (dataset) => <TextLink href={dataset.page}>{dataset.title}</TextLink>,
    },
    {
      id: "discussions",
      header: <Icon name="agora-line-chat" className="h-16 w-16" />,
      headerLabel: t("table.discussions"),
      renderCell: (dataset) => dataset.metrics?.discussions ?? 0,
    },
    {
      id: "views",
      header: <Icon name="agora-line-eye" className="h-16 w-16" />,
      headerLabel: t("table.views"),
      renderCell: (dataset) => dataset.metrics?.views ?? 0,
    },
    {
      id: "downloads",
      header: <Icon name="agora-line-download" className="h-16 w-16" />,
      headerLabel: t("table.downloads"),
      renderCell: (dataset) => dataset.metrics?.resources_downloads ?? 0,
    },
    {
      id: "reuses",
      header: <img src="/Icons/bar_chart.svg" alt={t("table.reuses")} className="h-16 w-16" />,
      headerLabel: t("table.reuses"),
      renderCell: (dataset) => dataset.metrics?.reuses ?? 0,
    },
    {
      id: "followers",
      header: <Icon name="agora-line-star" className="h-16 w-16" />,
      headerLabel: t("table.favorites"),
      renderCell: (dataset) => dataset.metrics?.followers ?? 0,
    },
  ];

  return (
    <AdminPaginatedTable
      pageSize={pageSize}
      totalItems={total}
      currentPage={page}
      setCurrentPage={onPageChange}
      setPageSize={onPageSizeChange}
    >
      <AdminListTable items={datasets} columns={columns} getRowKey={(dataset) => dataset.id} />
    </AdminPaginatedTable>
  );
}
