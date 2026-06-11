import type { CSSProperties, ReactNode } from "react";
import {
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@ama-pt/agora-design-system";
import type { SortOrder } from "./useClientTableState";

export interface AdminListColumn<T, F extends string = never> {
  id: string;
  header: ReactNode;
  headerLabel?: string;
  sortField?: F;
  sortType?: "numeric" | "date" | "string";
  renderCell: (item: T) => ReactNode;
}

interface AdminListTableProps<T, F extends string = never> {
  items: T[];
  columns: AdminListColumn<T, F>[];
  getSortOrder?: (field: F) => SortOrder;
  handleSort?: (field: F) => (newOrder: SortOrder) => void;
  getRowKey: (item: T) => string;
  getRowClassName?: (item: T) => string | undefined;
  getRowStyle?: (item: T) => CSSProperties | undefined;
  onRowClick?: (item: T) => void;
}

export default function AdminListTable<T, F extends string = never>({
  items,
  columns,
  getSortOrder,
  handleSort,
  getRowKey,
  getRowClassName,
  getRowStyle,
  onRowClick,
}: AdminListTableProps<T, F>) {
  return (
    <>
      <TableHeader>
        <TableRow>
          {columns.map((column) => {
            if (column.sortField && getSortOrder && handleSort) {
              return (
                <TableHeaderCell
                  key={column.id}
                  sortType={column.sortType}
                  sortOrder={getSortOrder(column.sortField)}
                  onSortChange={handleSort(column.sortField)}
                >
                  {column.header}
                </TableHeaderCell>
              );
            }

            return <TableHeaderCell key={column.id}>{column.header}</TableHeaderCell>;
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow
            key={getRowKey(item)}
            className={getRowClassName?.(item)}
            style={getRowStyle?.(item)}
            onClick={onRowClick ? () => onRowClick(item) : undefined}
          >
            {columns.map((column) => (
              <TableCell key={column.id} headerLabel={column.headerLabel ?? String(column.header)}>
                {column.renderCell(item)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </>
  );
}
