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
  const lastNavigatedRef = React.useRef(currentQuery);

  // Sync internal state only when the URL param changes externally (e.g. header search
  // navigation), never as an echo of our own debounced navigation — otherwise the input
  // gets reset mid-typing and the last typed character is dropped.
  React.useEffect(() => {
    if (currentQuery === lastNavigatedRef.current) return;
    lastNavigatedRef.current = currentQuery;
    setSearchQuery(currentQuery);
  }, [currentQuery]);

  React.useEffect(() => {
    if (searchQuery.trim() === currentQuery) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const q = searchQuery.trim();
      lastNavigatedRef.current = q;
      onSearchNavigate(q);
    }, debounceMs);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, currentQuery, onSearchNavigate, debounceMs]);

  const handleSearch = React.useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = searchQuery.trim();
    lastNavigatedRef.current = q;
    onSearchNavigate(q);
  }, [searchQuery, onSearchNavigate]);

  return {
    searchQuery,
    setSearchQuery,
    handleSearch,
  };
}
