import { useState } from "react";

/**
 * Whether a list's search/filter controls should be shown.
 *
 * Stays false during the first load and while the API has returned no data, then latches to true
 * once data arrives — so a later search or filter with zero results keeps the controls (and the
 * text typed in the search bar) instead of unmounting them. `hasActiveFilters` covers filters
 * pre-set from the URL, which must stay reachable even when they match nothing.
 */
export function useHasListData(isLoading: boolean, hasData: boolean, hasActiveFilters = false) {
  const [hasHadData, setHasHadData] = useState(false);
  if (!hasHadData && !isLoading && hasData) {
    setHasHadData(true);
  }
  return hasHadData || (!isLoading && hasData) || hasActiveFilters;
}
