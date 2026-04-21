"use client";

import { useEffect, useState } from "react";
import { fetchOrganization } from "@/services/api";

/**
 * Fetches an organization by id or slug and returns its display name.
 *
 * Used primarily by the admin back-office pages to render the organization
 * name in the breadcrumb instead of a literal "Organização".
 *
 * Returns `null` while loading or if the fetch fails.
 */
export function useOrganizationName(orgId: string | undefined | null): string | null {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!orgId) {
      setName(null);
      return;
    }
    fetchOrganization(orgId)
      .then((org) => {
        if (cancelled) return;
        setName(org?.name ?? null);
      })
      .catch(() => {
        if (!cancelled) setName(null);
      });
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  return name;
}
