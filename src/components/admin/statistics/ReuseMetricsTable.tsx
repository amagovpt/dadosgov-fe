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
import type { Reuse } from "@/service/types/reuse";

const PAGE_SIZE = 10;

interface ReuseMetricsTableProps {
  reuses: Reuse[];
  total: number;
  page: number;
  onPageChange: (page: number) => void;
}

export function ReuseMetricsTable({ reuses, total, page, onPageChange }: ReuseMetricsTableProps) {
  return (
    <Table paginationProps={createPaginationProps(PAGE_SIZE, total, page, onPageChange)}>
      <TableHeader>
        <TableRow>
          <TableHeaderCell>TÍTULO DA REUTILIZAÇÃO</TableHeaderCell>
          <TableHeaderCell>
            <Icon name="agora-line-eye" className="h-16 w-16" />
          </TableHeaderCell>
          <TableHeaderCell>
            <Icon name="agora-line-star" className="h-16 w-16" />
          </TableHeaderCell>
          <TableHeaderCell>ESTADO</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reuses.map((reuse) => (
          <TableRow key={reuse.id}>
            <TableCell headerLabel="Título">
              <TextLink href={reuse.url}>{reuse.title}</TextLink>
            </TableCell>
            <TableCell headerLabel="Visualizações">{reuse.metrics?.views ?? 0}</TableCell>
            <TableCell headerLabel="Favoritos">{reuse.metrics?.followers ?? 0}</TableCell>
            <TableCell headerLabel="Estado">
              {reuse.private ? "Privado" : reuse.archived ? "Arquivado" : "Público"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
