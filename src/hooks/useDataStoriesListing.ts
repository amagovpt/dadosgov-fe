"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Datastories } from "@/service/types/datastories/datastories";
import { DataStoriesFilterState } from "@/service/types/datastories/filters";
import { useListingUrlState } from "@/hooks/useListingUrlState";
import { useSearchFilterUrlSync } from "@/hooks/useSearchFilterUrlSync";
import {
  DATA_STORIES_PAGE_SIZE,
  filterDataStories,
  paginateDataStories,
  sortDataStories,
} from "@/utils/dataStoriesListingQuery";

interface UseDataStoriesListingArgs {
  currentPage: number;
  initialQuery?: string;
  stories: Datastories;
  activeFilters: DataStoriesFilterState;
}

export function useDataStoriesListing({
  currentPage,
  initialQuery,
  stories,
  activeFilters,
}: UseDataStoriesListingArgs) {
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") || initialQuery || "";
  const { buildUrl, replaceWith, activePage } = useListingUrlState(currentPage);

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

  const filteredStories = useMemo(
    () => filterDataStories(stories, searchQuery, activeFilters),
    [activeFilters, searchQuery, stories]
  );
  const sortedStories = useMemo(() => sortDataStories(filteredStories), [filteredStories]);
  const pagedStories = useMemo(
    () => paginateDataStories(sortedStories, activePage, DATA_STORIES_PAGE_SIZE),
    [activePage, sortedStories]
  );

  return {
    activePage,
    buildUrl,
    handleSearch,
    pagedStories,
    replaceWith,
    searchQuery,
    setSearchQuery,
    total: sortedStories.length,
  };
}

