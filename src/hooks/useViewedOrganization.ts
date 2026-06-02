"use client";

import { useEffect, useReducer } from "react";
import type { Organization } from "@/types/api";
import { fetchOrganization } from "@/services/api";

/**
 * Returns the display name for an organization referenced by id or slug.
 *
 * First performs a synchronous lookup against the caller's already-loaded
 * list (typically `user?.organizations` from AuthContext). If the org is
 * not in that list — e.g. an admin viewing an organization they don't
 * belong to — a one-shot fetch is issued to resolve the real name.
 *
 * Results are cached in module-local state so repeated renders and other
 * pages viewing the same org don't refetch.
 */
const cache = new Map<string, string>();

export function useViewedOrganizationName(
  orgId: string | undefined | null,
  organizations: Organization[] | undefined = [],
): string | null {
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  const nameFromList = orgId
    ? organizations.find((o) => o.id === orgId || o.slug === orgId)?.name ??
      null
    : null;
  const nameFromCache = orgId ? cache.get(orgId) ?? null : null;

  useEffect(() => {
    if (!orgId) return;
    if (nameFromList) return;
    if (cache.has(orgId)) return;
    let cancelled = false;
    fetchOrganization(orgId)
      .then((org) => {
        if (cancelled || !org?.name) return;
        cache.set(orgId, org.name);
        forceUpdate();
      })
      .catch((error) => {
        console.error("Error fetching viewed organization name:", error);
      });
    return () => {
      cancelled = true;
    };
  }, [orgId, nameFromList]);

  return nameFromList || nameFromCache;
}
