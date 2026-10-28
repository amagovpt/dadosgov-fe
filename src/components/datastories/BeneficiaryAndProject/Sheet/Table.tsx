"use client";

import { ReactNode, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";
import { Button } from "@ama-pt/agora-design-system";

/** ------------------------------------------------------------------------------------------------------ */

type TableAlign = "left" | "center" | "right";

export type TableColumn = {
  label: ReactNode;
  align?: TableAlign;
  /** Renders the column values in `primary-900`, like the value column of AreaValueList. */
  highlight?: boolean;
  className?: string;
};

export type TableRow = ReactNode[];

const alignClass: Record<TableAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

/** ------------------------------------------------------------------------------------------------------ */

interface ITableHeader {
  columns: TableColumn[];
}

function TableHeader({ columns }: ITableHeader) {
  const id = useId();

  return (
    <thead>
      <tr>
        {columns.map((column, index) => (
          <th
            key={`table-head-${id}-${index}`}
            scope="col"
            className={twMerge(
              "pb-8 px-16 text-s-bold text-neutral-900 align-bottom",
              alignClass[column.align ?? "left"],
              column.className
            )}
          >
            {column.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}

/** ------------------------------------------------------------------------------------------------------ */

interface ITableItem {
  row: TableRow;
  columns: TableColumn[];
  boldValues?: boolean;
}

function TableItem({ row, columns, boldValues }: ITableItem) {
  const id = useId();

  return (
    <tr className="border-b-2 border-b-neutral-200">
      {row.map((cell, index) => {
        const column = columns[index];

        return (
          <td
            key={`table-cell-${id}-${index}`}
            className={twMerge(
              "py-8 px-16 text-m-regular text-neutral-900",
              alignClass[column?.align ?? "left"],
              column?.highlight && "text-primary-900",
              column?.highlight && boldValues && "text-m-bold",
              column?.className
            )}
          >
            {cell}
          </td>
        );
      })}
    </tr>
  );
}

/** ------------------------------------------------------------------------------------------------------ */

export interface ITable {
  header?: TableColumn[];
  data: TableRow[];
  boldValues?: boolean;
  /** Rows shown per step, with a "see more" button for the next step. Ignored when < 1. */
  loadByParts?: number;
  seeMoreText?: string;
  className?: string;
}

export default function Table({
  header,
  data,
  boldValues,
  loadByParts,
  seeMoreText,
  className,
}: ITable) {
  const id = useId();
  const { t } = useTranslation();
  const [parts, setParts] = useState(1);
  const columns = header ?? [];

  const partSize = loadByParts && loadByParts >= 1 ? Math.floor(loadByParts) : undefined;
  const visibleRows = partSize ? data.slice(0, partSize * parts) : data;
  const hasMoreRows = visibleRows.length < data.length;

  return (
    <div className="w-full flex flex-col gap-32">
      <div className={twMerge("w-full overflow-x-auto", className)}>
        <table className="w-full border-collapse">
          {header && <TableHeader columns={columns} />}
          <tbody>
            {visibleRows.map((row, index) => (
              <TableItem
                key={`table-row-${id}-${index}`}
                row={row}
                columns={columns}
                boldValues={boldValues}
              />
            ))}
          </tbody>
        </table>
      </div>

      {hasMoreRows && (
        <div className="flex justify-center">
          <Button
            onClick={() => setParts((prev) => prev + 1)}
            appearance="link"
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
