"use client";

import { useEffect, useState } from "react";
import { fetchDatastoriesViews } from "@/service/api/datastories";

type Fetched = { key: string; views: Record<string, number> | null };

/**
 * View counts for a set of datastory cards, fetched once per distinct set of slugs.
 *
 * Returns `null` until the counts for the current slugs arrive, and if the request fails, so
 * a card can leave the counter out instead of flashing a 0 or showing one that is not true.
 */
export function useDatastoriesViews(slugs: string[]): Record<string, number> | null {
  // The callers rebuild the array on every render; key the request on its content.
  const key = [...new Set(slugs)].sort().join(",");
  const [fetched, setFetched] = useState<Fetched | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchDatastoriesViews(key ? key.split(",") : []).then((views) => {
      if (!cancelled) setFetched({ key, views });
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  // A previous page's counts are never shown against the current cards.
  return fetched?.key === key ? fetched.views : null;
}
