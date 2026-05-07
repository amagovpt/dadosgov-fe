"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchOrganizations } from "@/services/api";
import { APIResponse, Organization } from "@/types/api";
import { useListingUrlState } from "@/hooks/useListingUrlState";
import { useSearchFilterUrlSync } from "@/hooks/useSearchFilterUrlSync";
import {
  getOrganizationSortDefault,
  ORGANIZATION_SORT_OPTIONS,
  parseOrganizationsFilters,
} from "@/utils/organizationsListingQuery";

interface UseOrganizationsListingArgs {
  initialData: APIResponse<Organization>;
  currentPage: number;
}

export function useOrganizationsListing({
  initialData,
  currentPage,
}: UseOrganizationsListingArgs) {
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const currentQuery = searchParams.get("q") || "";
  const currentSort = searchParams.get("sort");

  const { buildUrl, replaceWith, activePage } = useListingUrlState(currentPage);
  const [listData, setListData] = useState<APIResponse<Organization>>(initialData);

  useEffect(() => {
    let cancelled = false;

    async function loadOrganizationsFromUrl() {
      const params = new URLSearchParams(queryString);
      const filters = parseOrganizationsFilters(params);
      const next = await fetchOrganizations(activePage, initialData.page_size || 20, filters);
      if (!cancelled) setListData(next);
    }

    loadOrganizationsFromUrl();
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
      const sortValue = ORGANIZATION_SORT_OPTIONS[selectedKey] || null;
      if (sortValue === (currentSort || null)) return;
      replaceWith({ sort: sortValue, page: 1 });
    },
    [currentSort, replaceWith]
  );

  const sortDefault = getOrganizationSortDefault(currentSort);

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

