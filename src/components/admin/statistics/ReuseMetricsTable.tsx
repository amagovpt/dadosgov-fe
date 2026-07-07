"use client";

import { useTranslation } from "react-i18next";
import { Icon } from "@ama-pt/agora-design-system";
import TextLink from "@/components/Primitives/TextLink";
import AdminListTable, { type AdminListColumn } from "@/components/admin/lists/AdminListTable";
import AdminPaginatedTable from "@/components/admin/lists/AdminPaginatedTable";
import type { Reuse } from "@/service/types/reuse";

const PAGE_SIZE = 10;

interface ReuseMetricsTableProps {
  reuses: Reuse[];
  total: number;
  page: number;
  onPageChange: (page: number) => void;
}

export function ReuseMetricsTable({ reuses, total, page, onPageChange }: ReuseMetricsTableProps) {
  const { t } = useTranslation("admin-statistics");

  const columns: AdminListColumn<Reuse>[] = [
    {
      id: "title",
      header: t("table.reuseTitle"),
      headerLabel: t("table.title"),
      renderCell: (reuse) => <TextLink href={reuse.url}>{reuse.title}</TextLink>,
    },
    {
      id: "views",
      header: <Icon name="agora-line-eye" className="h-16 w-16" />,
      headerLabel: t("table.views"),
      renderCell: (reuse) => reuse.metrics?.views ?? 0,
    },
    {
      id: "followers",
      header: <Icon name="agora-line-star" className="h-16 w-16" />,
      headerLabel: t("table.favorites"),
      renderCell: (reuse) => reuse.metrics?.followers ?? 0,
    },
    {
      id: "status",
      header: t("table.status"),
      headerLabel: t("table.status"),
      renderCell: (reuse) =>
        reuse.private ? t("status.private") : reuse.archived ? t("status.archived") : t("status.public"),
    },
  ];

  return (
    <AdminPaginatedTable
      pageSize={PAGE_SIZE}
      totalItems={total}
      currentPage={page}
      setCurrentPage={onPageChange}
    >
      <AdminListTable items={reuses} columns={columns} getRowKey={(reuse) => reuse.id} />
    </AdminPaginatedTable>
  );
}
