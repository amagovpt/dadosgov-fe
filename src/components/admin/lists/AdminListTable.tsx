import { Fragment } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@ama-pt/agora-design-system";
import type { SortOrder } from "@/hooks/admin-lists/useClientTableState";

export interface AdminListColumn<T, F extends string = never> {
  id: string;
  header: ReactNode;
  headerLabel?: string;
  sortField?: F;
  sortType?: "numeric" | "date" | "string";
  renderCell: (item: T) => ReactNode;
  /** Value for the CSV export; without it the column is not exported. */
  exportValue?: (item: T) => string | number | boolean | null | undefined;
  /** Internal path of the cell's link; exported in the CSV's last column. */
  exportUrl?: (item: T) => string | undefined;
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
  /**
   * An extra row rendered under `item`, for detail that does not fit a cell.
   *
   * Purely additive: a list that does not pass it renders exactly as before,
   * because returning nothing emits nothing. The caller owns whatever decides
   * when to show it -- the table stays unaware of what is being expanded.
   */
  renderExpandedRow?: (item: T) => ReactNode;
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
  renderExpandedRow,
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
        {items.map((item) => {
          const expanded = renderExpandedRow?.(item);

          return (
            <Fragment key={getRowKey(item)}>
              <TableRow
                className={getRowClassName?.(item)}
                style={getRowStyle?.(item)}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    headerLabel={column.headerLabel ?? String(column.header)}
                  >
                    {column.renderCell(item)}
                  </TableCell>
                ))}
              </TableRow>
              {expanded ? (
                <TableRow>
                  <TableCell headerLabel="" colSpan={columns.length}>
                    {expanded}
                  </TableCell>
                </TableRow>
              ) : null}
            </Fragment>
          );
        })}
      </TableBody>
    </>
  );
}

