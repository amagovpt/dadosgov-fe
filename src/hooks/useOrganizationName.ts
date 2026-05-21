"use client";

import type { Organization } from '@/service/types/identity';

/**
 * Returns the display name of an organization from a list already loaded
 * by the caller (typically `useActiveOrganization().organizations`).
 *
 * Synchronous, no network round-trip, no extra React state. This keeps
 * tab switching in the admin back-office snappy — the caller already
 * paid for the fetch via useActiveOrganization() and we just reuse it.
 *
 * Returns `null` when the organization isn't in the provided list (e.g.
 * user isn't a member). Callers should fall back to `activeOrg?.name` or
 * the literal "Organização".
 */
export function useOrganizationName(
  orgId: string | undefined | null,
  organizations: Organization[] = [],
): string | null {
  if (!orgId) return null;
  return (
    organizations.find((o) => o.id === orgId || o.slug === orgId)?.name ?? null
  );
}
