"use client";

import { ReactNode, useId } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";
import { Button } from "@ama-pt/agora-design-system";
import { LoadMoreHandler, useLoadMore } from "@/hooks/useLoadMore";

/** ------------------------------------------------------------------------------------------------------ */

type TableAlign = "left" | "center" | "right";

export type TableColumn<T> = {
  label: ReactNode;
  render: (item: T, index: number) => ReactNode;
  align?: TableAlign;
  highlight?: boolean;
  width?: string | number;
  className?: string;
};

const alignClass: Record<TableAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

/** ------------------------------------------------------------------------------------------------------ */

interface ITableHeader<T> {
  columns: TableColumn<T>[];
}

function TableHeader<T>({ columns }: ITableHeader<T>) {
  const id = useId();

  return (
    <thead>
      <tr>
        {columns.map((column, index) => (
          <th
            key={`table-head-${id}-${index}`}
            scope="col"
            className={`text-s-bold ${twMerge(
              "px-16 pb-8 align-bottom text-neutral-900",
              alignClass[column.align ?? "left"],
              column.className
            )}`}
          >
            {column.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}

/** ------------------------------------------------------------------------------------------------------ */

interface ITableItem<T> {
  item: T;
  index: number;
  columns: TableColumn<T>[];
  boldValues?: boolean;
}

function TableItem<T>({ item, index, columns, boldValues }: ITableItem<T>) {
  const id = useId();

  return (
    <tr className="border-b-2 border-b-neutral-200">
      {columns.map((column, columnIndex) => (
        <td
          key={`table-cell-${id}-${columnIndex}`}
          className={`${column.highlight && boldValues ? "text-m-bold" : "text-m-regular"} ${twMerge(
            "px-16 py-8 text-neutral-900",
            alignClass[column.align ?? "left"],
            column.highlight && "text-neutral-900",
            column.className
          )}`}
        >
          {column.render(item, index)}
        </td>
      ))}
    </tr>
  );
}

/** ------------------------------------------------------------------------------------------------------ */

export interface ITable<T> {
  columns: TableColumn<T>[];
  initialItems: T[];
  onLoadMore?: LoadMoreHandler<T>; // fetches the next page; the "see more" button only shows when this is provided
  totalItems?: number; // total available on the server; hides "see more" once every item is loaded
  getRowKey?: (item: T, index: number) => string;
  hideHeader?: boolean;
  boldValues?: boolean;
  seeMoreText?: string;
  className?: string;
}

export default function Table<T>({
  columns,
  initialItems,
  onLoadMore,
  totalItems,
  getRowKey,
  hideHeader,
  boldValues,
  seeMoreText,
  className,
}: ITable<T>) {
  const id = useId();
  const { t } = useTranslation();
  const { items, isLoading, hasMore, loadMore } = useLoadMore({
    initialItems,
    onLoadMore,
    totalItems,
  });

  return (
    <div className="flex w-full flex-col gap-32">
      <div className={twMerge("w-full overflow-x-auto", className)}>
        <table className="w-full border-collapse">
          {columns.some((column) => column.width !== undefined) && (
            <colgroup>
              {columns.map((column, index) => (
                <col key={`table-col-${id}-${index}`} style={{ width: column.width }} />
              ))}
            </colgroup>
          )}
          {!hideHeader && <TableHeader columns={columns} />}
          <tbody>
            {items.map((item, index) => (
              <TableItem
                key={getRowKey?.(item, index) ?? `table-row-${id}-${index}`}
                item={item}
                index={index}
                columns={columns}
                boldValues={boldValues}
              />
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button
            onClick={loadMore}
            disabled={isLoading}
            appearance="link"
            variant="neutral"
            trailingIcon="agora-line-plus-circle"
            trailingIconHover="agora-solid-plus-circle"
            hasIcon
          >
            {t("seeMore", { about: seeMoreText })}
          </Button>
        </div>
      )}
    </div>
  );
}

/** ------------------------------------------------------------------------------------------------------ */
