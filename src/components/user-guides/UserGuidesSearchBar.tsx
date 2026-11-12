"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { InputSearchBar } from "@ama-pt/agora-design-system";
import { useSearchFilterUrlSync } from "@/hooks/useSearchFilterUrlSync";

interface UserGuidesSearchBarProps {
  label: string;
  placeholder: string;
  searchActionAltText: string;
}

/**
 * Search-as-you-type for the guides index. The filter itself runs in `UserGuidesIndexClient`
 * from `?q=`, so the term only has to reach the URL: a native `history.replaceState` (synced
 * into `useSearchParams` by Next) updates it without a server round trip, a scroll jump or a
 * history entry per keystroke. Emptying the input removes `q` and brings every guide back.
 */
export function UserGuidesSearchBar({
  label,
  placeholder,
  searchActionAltText,
}: UserGuidesSearchBarProps) {
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") ?? "";

  const onSearchNavigate = useCallback((query: string) => {
    const params = new URLSearchParams(window.location.search);
    if (query) params.set("q", query);
    else params.delete("q");
    const qs = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  }, []);

  const { searchQuery, setSearchQuery, handleSearch } = useSearchFilterUrlSync({
    currentQuery,
    onSearchNavigate,
  });

  return (
    <InputSearchBar
      id="user-guides-search"
      label={label}
      placeholder={placeholder}
      searchActionAltText={searchActionAltText}
      hasVoiceActionButton={false}
      darkMode
      minLength={1}
      value={searchQuery}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSearch();
      }}
      onSearchActivate={() => handleSearch()}
    />
  );
}
