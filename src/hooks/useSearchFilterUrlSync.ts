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
  // True from the first keystroke until the typed value is reflected in the URL.
  // While set, incoming URL changes are ignored: they are echoes of our own
  // debounced navigations (which can overlap and arrive out of order), and
  // applying a stale echo would reset the input mid-typing, dropping characters.
  const hasUnsyncedEditRef = React.useRef(false);

  // Sync internal state only when the URL param changes externally (e.g. header
  // search navigation), never while the user is still typing ahead of the URL.
  React.useEffect(() => {
    if (hasUnsyncedEditRef.current) return;
    setSearchQuery(currentQuery);
  }, [currentQuery]);

  React.useEffect(() => {
    if (searchQuery.trim() === currentQuery) {
      hasUnsyncedEditRef.current = false;
      return;
    }
    hasUnsyncedEditRef.current = true;
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
