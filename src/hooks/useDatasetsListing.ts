"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { APIResponse, Dataset } from "@/types/api";
import { useListingUrlState } from "@/hooks/useListingUrlState";
import { useSearchFilterUrlSync } from "@/hooks/useSearchFilterUrlSync";
import {
  DATASET_SORT_OPTIONS,
  getDatasetSortDefault,
} from "@/utils/datasetsListingQuery";

interface UseDatasetsListingArgs {
  initialData: APIResponse<Dataset>;
  currentPage: number;
}

export function useDatasetsListing({ initialData, currentPage }: UseDatasetsListingArgs) {
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") || "";
  const currentSort = searchParams.get("sort");

  const { buildUrl, replaceWith, activePage } = useListingUrlState(currentPage);
  const listData: APIResponse<Dataset> = initialData;

  const onSearchNavigate = useCallback(
    (query: string) => {
      replaceWith({ q: query || null, page: 1 });
    },
    [replaceWith]
  );

  const { searchQuery, setSearchQuery, handleSearch } = useSearchFilterUrlSync({
    currentQuery,
    onSearchNavigate,
  });

  const handleSortChange = useCallback(
    (selectedKey: string) => {
      const sortValue = DATASET_SORT_OPTIONS[selectedKey] || null;
      if (sortValue === (currentSort || null)) return;
      replaceWith({ sort: sortValue, page: 1 });
    },
    [currentSort, replaceWith]
  );

  const sortDefault = getDatasetSortDefault(currentSort);

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

