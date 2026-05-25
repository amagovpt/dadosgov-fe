import { useState } from "react";

export type SortOrder = "none" | "ascending" | "descending";

export function useAdminSort<T extends string>() {
  const [sortField, setSortField] = useState<T | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");

  const handleSort = (field: T) => (newOrder: SortOrder) => {
    setSortField(newOrder === "none" ? null : field);
    setSortOrder(newOrder);
  };

  const getSortOrder = (field: T): SortOrder => (sortField === field ? sortOrder : "none");

  return { sortField, sortOrder, handleSort, getSortOrder };
}
