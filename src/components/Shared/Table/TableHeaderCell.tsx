"use client";

import {
  Button,
  Icon,
  TableHeaderCell as TableHeaderCellADS,
  type TableHeaderCellProps,
} from "@ama-pt/agora-design-system";

export default function TableHeaderCell({
  sortType,
  sortOrder = "none",
  onSortChange,
  scope = "col",
  children,
  "aria-label": ariaLabel,
  ...props
}: TableHeaderCellProps) {
  if (sortType !== "numeric" && sortType !== "date") {
    return (
      <TableHeaderCellADS
        {...props}
        scope={scope}
        sortType={sortType}
        sortOrder={sortOrder}
        onSortChange={onSortChange}
        aria-label={ariaLabel}
      >
        {children}
      </TableHeaderCellADS>
    );
  }

  // Ágora maps "ascending" dates/numbers to descending bars; its table story
  // also reverses those comparisons. Our lists use ascending = low to high,
  // so match the icon to that order while preserving sort state and callbacks.
  const icon =
    sortOrder === "ascending"
      ? "agora-solid-sort-generic-up"
      : sortOrder === "descending"
        ? "agora-solid-sort-generic-down"
        : "agora-solid-sort-vertical";
  const nextOrder =
    sortOrder === "none" ? "ascending" : sortOrder === "ascending" ? "descending" : "none";

  return (
    <th {...props} scope={scope} aria-sort={sortOrder}>
      <Button
        type="button"
        className="table-header-cell"
        appearance="link"
        variant="neutral"
        aria-label={
          ariaLabel || (typeof children === "string" ? `Order by ${children}` : undefined)
        }
        onClick={() => onSortChange?.(nextOrder)}
      >
        <span className="table-header-cell__content">
          <Icon name={icon} aria-hidden />
          <span className="children-wrapper">{children}</span>
        </span>
      </Button>
    </th>
  );
}
