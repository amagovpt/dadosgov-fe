"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchReuses } from "@/services/api";
import { APIResponse, Reuse } from "@/types/api";
import { useListingUrlState } from "@/hooks/useListingUrlState";
import { useSearchFilterUrlSync } from "@/hooks/useSearchFilterUrlSync";
import {
  getReuseSortDefault,
  parseReusesFilters,
  REUSE_SORT_OPTIONS,
} from "@/utils/reusesListingQuery";

interface UseReusesListingArgs {
  initialData: APIResponse<Reuse>;
  currentPage: number;
}

export function useReusesListing({ initialData, currentPage }: UseReusesListingArgs) {
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const currentQuery = searchParams.get("q") || "";
  const currentSort = searchParams.get("sort");

  const { buildUrl, replaceWith, activePage } = useListingUrlState(currentPage);
  const [listData, setListData] = useState<APIResponse<Reuse>>(initialData);

  useEffect(() => {
    let cancelled = false;

    async function loadReusesFromUrl() {
      const params = new URLSearchParams(queryString);
      const filters = parseReusesFilters(params);
      const next = await fetchReuses(activePage, initialData.page_size || 12, filters);
      if (!cancelled) setListData(next);
    }

    loadReusesFromUrl();
    return () => {
      cancelled = true;
    };
  }, [activePage, initialData.page_size, queryString]);

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
