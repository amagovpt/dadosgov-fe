"use client";

import {
  Icon,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "@ama-pt/agora-design-system";
import TextLink from "@/components/Primitives/TextLink";
import { createPaginationProps } from "@/utils/createPaginationProps";
import type { Dataset } from "@/service/types/dataset";

const PAGE_SIZE = 10;

interface DatasetMetricsTableProps {
  datasets: Dataset[];
  total: number;
  page: number;
  onPageChange: (page: number) => void;
}

export function DatasetMetricsTable({ datasets, total, page, onPageChange }: DatasetMetricsTableProps) {
  return (
    <Table paginationProps={createPaginationProps(PAGE_SIZE, total, page, onPageChange)}>
      <TableHeader>
        <TableRow>
          <TableHeaderCell>TÍTULO DO CONJUNTO DE DADOS</TableHeaderCell>
          <TableHeaderCell>
            <Icon name="agora-line-chat" className="h-16 w-16" />
          </TableHeaderCell>
          <TableHeaderCell>
            <Icon name="agora-line-eye" className="h-16 w-16" />
          </TableHeaderCell>
          <TableHeaderCell>
            <Icon name="agora-line-download" className="h-16 w-16" />
          </TableHeaderCell>
          <TableHeaderCell>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Icons/bar_chart.svg" alt="Reutilizações" className="h-16 w-16" />
          </TableHeaderCell>
          <TableHeaderCell>
            <Icon name="agora-line-star" className="h-16 w-16" />
          </TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {datasets.map((dataset) => (
          <TableRow key={dataset.id}>
            <TableCell headerLabel="Título">
              <TextLink href={dataset.page}>{dataset.title}</TextLink>
            </TableCell>
            <TableCell headerLabel="Discussões">{dataset.metrics?.discussions ?? 0}</TableCell>
            <TableCell headerLabel="Visualizações">{dataset.metrics?.views ?? 0}</TableCell>
            <TableCell headerLabel="Downloads">{dataset.metrics?.resources_downloads ?? 0}</TableCell>
            <TableCell headerLabel="Reutilizações">{dataset.metrics?.reuses ?? 0}</TableCell>
            <TableCell headerLabel="Favoritos">{dataset.metrics?.followers ?? 0}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
