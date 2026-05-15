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

  // Sync internal state when the URL param changes externally (e.g. header search navigation)
  React.useEffect(() => {
    setSearchQuery(currentQuery);
  }, [currentQuery]);

  React.useEffect(() => {
    if (searchQuery.trim() === currentQuery) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearchNavigate(searchQuery.trim());
    }, debounceMs);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, currentQuery, onSearchNavigate, debounceMs]);

  const handleSearch = React.useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onSearchNavigate(searchQuery.trim());
  }, [searchQuery, onSearchNavigate]);

  return {
    searchQuery,
    setSearchQuery,
    handleSearch,
  };
}
