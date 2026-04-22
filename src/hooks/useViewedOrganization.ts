"use client";

import { useEffect, useRef, useState } from "react";
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
 * The fallback only runs when necessary and caches results in module-local
 * state so repeated renders don't refetch.
 */
const cache = new Map<string, string>();

export function useViewedOrganizationName(
  orgId: string | undefined | null,
  organizations: Organization[] = [],
): string | null {
  const cachedName =
    orgId
      ? organizations.find((o) => o.id === orgId || o.slug === orgId)?.name ??
        null
      : null;

  const [fetchedName, setFetchedName] = useState<string | null>(
    orgId ? cache.get(orgId) ?? null : null,
  );
  const lastFetchedId = useRef<string | null>(null);

  useEffect(() => {
    if (!orgId || cachedName) {
      lastFetchedId.current = null;
      return;
    }
    const cached = cache.get(orgId);
    if (cached) {
      setFetchedName(cached);
      return;
    }
    if (lastFetchedId.current === orgId) return;
    lastFetchedId.current = orgId;
    let cancelled = false;
    fetchOrganization(orgId)
      .then((org) => {
        if (cancelled || !org?.name) return;
        cache.set(orgId, org.name);
        setFetchedName(org.name);
      })
      .catch((error) => {
        console.error("Error fetching viewed organization name:", error);
      });
    return () => {
      cancelled = true;
    };
  }, [orgId, cachedName]);

  return cachedName || fetchedName;
}
