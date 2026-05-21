"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { APIResponse, Reuse } from "@/service/types/api";
import { useListingUrlState } from "@/hooks/useListingUrlState";
import { useSearchFilterUrlSync } from "@/hooks/useSearchFilterUrlSync";
import {
  getReuseSortDefault,
  REUSE_SORT_OPTIONS,
} from "@/utils/reusesListingQuery";

interface UseReusesListingArgs {
  initialData: APIResponse<Reuse>;
  currentPage: number;
}

export function useReusesListing({ initialData, currentPage }: UseReusesListingArgs) {
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") || "";
  const currentSort = searchParams.get("sort");

  const { buildUrl, replaceWith, activePage } = useListingUrlState(currentPage);
  const listData: APIResponse<Reuse> = initialData;

  const onSearchNavigate = useCallback(
    (query: string) => {
      replaceWith({ q: query || undefined, page: 1 });
    },
    [replaceWith]
  );

  const { searchQuery, setSearchQuery, handleSearch } = useSearchFilterUrlSync({
    currentQuery,
    onSearchNavigate,
  });

  const handleSortChange = useCallback(
    (value: string) => {
      replaceWith({ sort: REUSE_SORT_OPTIONS[value] || undefined, page: 1 });
    },
    [replaceWith]
  );

  const sortDefault = getReuseSortDefault(currentSort);

  return {
    activePage,
    buildUrl,
    handleSearch,
    handleSortChange,
    listData,
    searchQuery,
    setSearchQuery,
    sortDefault,
  };
}
