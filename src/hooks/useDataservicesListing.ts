"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Dataservice } from "@/service/types/dataservice";
import { APIResponse } from "@/service/types/shared";
import { useListingUrlState } from "@/hooks/useListingUrlState";
import { useSearchFilterUrlSync } from "@/hooks/useSearchFilterUrlSync";
import {
  getDataserviceSortDefault,
  DATASERVICE_SORT_OPTIONS,
} from "@/utils/dataservicesListingQuery";

interface UseDataservicesListingArgs {
  initialData: APIResponse<Dataservice>;
  currentPage: number;
}

export function useDataservicesListing({ initialData, currentPage }: UseDataservicesListingArgs) {
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") || "";
  const currentSort = searchParams.get("sort");

  const { buildUrl, replaceWith, activePage } = useListingUrlState(currentPage);
  const listData: APIResponse<Dataservice> = initialData;

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
      replaceWith({ sort: DATASERVICE_SORT_OPTIONS[value] || undefined, page: 1 });
    },
    [replaceWith]
  );

  const sortDefault = getDataserviceSortDefault(currentSort);

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
