"use client";

import React from "react";

interface UseSearchUrlSyncOptions {
  currentQuery: string;
  onSearchNavigate: (query: string) => void;
  debounceMs?: number;
}

export function useSearchFilterUrlSync({
  currentQuery,
  onSearchNavigate,
  debounceMs = 200,
}: UseSearchUrlSyncOptions) {
  const [searchQuery, setSearchQuery] = React.useState(currentQuery);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const internalNavRef = React.useRef(false);

  // Sync internal state when the URL param changes externally (e.g. header search navigation).
  // Skip the sync when the URL change was triggered by this hook itself — otherwise fast typing
  // gets clobbered: the debounced navigation lands after extra characters are already in state.
  React.useEffect(() => {
    if (internalNavRef.current) {
      internalNavRef.current = false;
      return;
    }
    setSearchQuery(currentQuery);
  }, [currentQuery]);

  React.useEffect(() => {
    if (searchQuery.trim() === currentQuery) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      internalNavRef.current = true;
      onSearchNavigate(searchQuery.trim());
    }, debounceMs);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, currentQuery, onSearchNavigate, debounceMs]);

  const handleSearch = React.useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    internalNavRef.current = true;
    onSearchNavigate(searchQuery.trim());
  }, [searchQuery, onSearchNavigate]);

  return {
    searchQuery,
    setSearchQuery,
    handleSearch,
  };
}
