"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Whether `query` (a CSS media query, e.g. `"(max-width: 1023px)"`) currently matches.
 * Returns `false` on the server and during hydration, then follows the viewport.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query]
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
}
