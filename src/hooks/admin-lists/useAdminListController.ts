import { useMemo, useState } from "react";
import { buildApiSortParam } from "@/utils/admin-lists/listHelpers";
import { useDebouncedSearch } from "@/hooks/admin-lists/useDebouncedSearch";
import { SortOrder, useSortControls } from "@/hooks/admin-lists/useClientTableState";

interface UseAdminListControllerOptions<F extends string, TFilters extends Record<string, string>> {
  initialPageSize?: number;
  initialSortField?: F | null;
  initialSortOrder?: SortOrder;
  initialSearchQuery?: string;
  initialFilters: TFilters;
  sortFieldMap?: Record<F, string | null>;
  searchDebounceMs?: number;
}

export function useAdminListController<
  F extends string,
  TFilters extends Record<string, string> = Record<string, string>,
>({
  initialPageSize = 10,
  initialSortField = null,
  initialSortOrder = "none",
  initialSearchQuery = "",
  initialFilters,
  sortFieldMap,
  searchDebounceMs = 400,
}: UseAdminListControllerOptions<F, TFilters>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [sortField, setSortField] = useState<F | null>(initialSortField);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialSortOrder);
  const [filters, setFilters] = useState<TFilters>(initialFilters);

  const { handleSort, getSortOrder } = useSortControls(
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    setCurrentPage
  );

  const sortParam = useMemo(
    () => (sortFieldMap ? buildApiSortParam(sortField, sortOrder, sortFieldMap) : undefined),
    [sortField, sortOrder, sortFieldMap]
  );

  const setSearchAndResetPage = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleSearch = useDebouncedSearch(setSearchAndResetPage, searchDebounceMs);

  const updateFilter = <K extends keyof TFilters>(key: K, value: TFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  return {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    searchQuery,
    setSearchQuery,
    setSearchAndResetPage,
    handleSearch,
    sortField,
    setSortField,
    sortOrder,
    setSortOrder,
    handleSort,
    getSortOrder,
    sortParam,
    filters,
    setFilters,
    updateFilter,
  };
}

