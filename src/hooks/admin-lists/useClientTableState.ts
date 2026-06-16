import { useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";

export type SortOrder = "none" | "ascending" | "descending";
export type SortValue = string | number | Date | null | undefined;

export interface UseClientTableStateOptions<T, F extends string> {
  items: T[];
  currentPage: number;
  pageSize: number;
  sortField: F | null;
  sortOrder: SortOrder;
  sorters: Record<F, (item: T) => SortValue>;
}

interface SortControls<F extends string> {
  handleSort: (field: F) => (newOrder: SortOrder) => void;
  getSortOrder: (field: F) => SortOrder;
}

function compareSortValues(a: SortValue, b: SortValue): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;

  const aDate = a instanceof Date ? a.getTime() : null;
  const bDate = b instanceof Date ? b.getTime() : null;
  if (aDate != null && bDate != null) return aDate - bDate;

  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }

  return String(a).localeCompare(String(b), "pt", { sensitivity: "base" });
}

export function useClientTableState<T, F extends string>({
  items,
  currentPage,
  pageSize,
  sortField,
  sortOrder,
  sorters,
}: UseClientTableStateOptions<T, F>) {
  const sortedItems = useMemo(() => {
    if (!sortField || sortOrder === "none") return items;

    const getSortValue = sorters[sortField];
    if (!getSortValue) return items;

    const sorted = [...items].sort((left, right) =>
      compareSortValues(getSortValue(left), getSortValue(right))
    );

    return sortOrder === "descending" ? sorted.reverse() : sorted;
  }, [items, sortField, sortOrder, sorters]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedItems.slice(start, start + pageSize);
  }, [sortedItems, currentPage, pageSize]);

  return {
    totalItems: sortedItems.length,
    sortedItems,
    paginatedItems,
  };
}

export function useSortControls<F extends string>(
  sortField: F | null,
  sortOrder: SortOrder,
  setSortField: Dispatch<SetStateAction<F | null>>,
  setSortOrder: Dispatch<SetStateAction<SortOrder>>,
  setCurrentPage?: Dispatch<SetStateAction<number>>
): SortControls<F> {
  const handleSort = (field: F) => (newOrder: SortOrder) => {
    setSortField(newOrder === "none" ? null : field);
    setSortOrder(newOrder);
    if (setCurrentPage) setCurrentPage(1);
  };

  const getSortOrder = (field: F): SortOrder =>
    sortField === field ? sortOrder : "none";

  return {
    handleSort,
    getSortOrder,
  };
}
