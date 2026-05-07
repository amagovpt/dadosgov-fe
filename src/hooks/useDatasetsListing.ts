"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchDatasets } from "@/services/api";
import { APIResponse, Dataset } from "@/types/api";
import { useListingUrlState } from "@/hooks/useListingUrlState";
import { useSearchFilterUrlSync } from "@/hooks/useSearchFilterUrlSync";
import {
  DATASET_SORT_OPTIONS,
  getDatasetSortDefault,
  parseDatasetsFilters,
} from "@/utils/datasetsListingQuery";

interface UseDatasetsListingArgs {
  initialData: APIResponse<Dataset>;
  currentPage: number;
}

export function useDatasetsListing({ initialData, currentPage }: UseDatasetsListingArgs) {
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const currentQuery = searchParams.get("q") || "";
  const currentSort = searchParams.get("sort");

  const { buildUrl, replaceWith, activePage } = useListingUrlState(currentPage);
  const [listData, setListData] = useState<APIResponse<Dataset>>(initialData);

  useEffect(() => {
    let cancelled = false;

    async function loadDatasetsFromUrl() {
      const params = new URLSearchParams(queryString);
      const filters = parseDatasetsFilters(params);
      const next = await fetchDatasets(activePage, initialData.page_size || 20, filters);
      if (!cancelled) setListData(next);
    }

    loadDatasetsFromUrl();
    return () => {
      cancelled = true;
    };
  }, [activePage, initialData.page_size, queryString]);

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

