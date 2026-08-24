"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { suggestOrganizations } from "@/service/api/organizations";
import { can } from "@/utils/permissions";

export interface ProducerOrganization {
  id: string;
  name: string;
}

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 20;

function mergeById(...lists: ProducerOrganization[][]): ProducerOrganization[] {
  const merged: ProducerOrganization[] = [];
  const seen = new Set<string>();

  for (const list of lists) {
    for (const organization of list) {
      if (seen.has(organization.id)) continue;
      seen.add(organization.id);
      merged.push(organization);
    }
  }

  return merged;
}

/**
 * Which organizations the current user may publish a harvester for.
 *
 * A portal admin may create a source for any organization — the backend lets
 * them through because every udata `Permission` carries `RoleNeed("admin")` —
 * but `/api/1/me/` only reports the user's memberships, so the list cannot come
 * from the session alone. Admins therefore get a server-side typeahead over
 * `/organizations/suggest/`; everyone else gets their memberships filtered by
 * the backend-computed `permissions.harvest` flag, which is exactly what
 * `POST /harvest/sources/` checks.
 */
export function useHarvesterProducerOptions() {
  const { t } = useTranslation("admin-harvesters");
  const { user, isAdmin, isLoading: isLoadingUser } = useAuth();

  const [defaultSuggestions, setDefaultSuggestions] = useState<ProducerOrganization[]>([]);
  const [searchResults, setSearchResults] = useState<ProducerOrganization[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selected, setSelected] = useState<ProducerOrganization | null>(null);
  // Every organization seen so far, so a selection can still be resolved to its
  // name after the search results that surfaced it have been replaced.
  const knownNamesRef = useRef<Map<string, string>>(new Map());

  // Memberships where the backend says a harvester may be created. For an admin
  // the flag is true everywhere, so this doubles as their "own organizations".
  const memberOrganizations = useMemo(
    () =>
      (user?.organizations || [])
        .filter((organization) => can(organization, "harvest"))
        .map((organization) => ({ id: organization.id, name: organization.name })),
    [user?.organizations],
  );

  // Preload a non-empty list so the admin dropdown is usable before typing.
  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;

    suggestOrganizations("", MAX_RESULTS)
      .then((organizations) => {
        if (cancelled) return;
        setDefaultSuggestions(
          organizations.map((organization) => ({
            id: organization.id,
            name: organization.name,
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setDefaultSuggestions([]);
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const query = searchQuery.trim();
    // Defer the state updates: the design system fires onSearchInputChange from
    // its own render cycle, so setting state synchronously here cascades.
    let frameId: number | null = null;

    if (query.length < MIN_QUERY_LENGTH) {
      frameId = requestAnimationFrame(() => {
        setSearchResults([]);
        setIsSearching(false);
      });
      return () => {
        if (frameId !== null) cancelAnimationFrame(frameId);
      };
    }

    frameId = requestAnimationFrame(() => setIsSearching(true));
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const organizations = await suggestOrganizations(query, MAX_RESULTS);
        if (cancelled) return;
        setSearchResults(
          organizations.map((organization) => ({
            id: organization.id,
            name: organization.name,
          })),
        );
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      if (frameId !== null) cancelAnimationFrame(frameId);
      clearTimeout(timer);
    };
  }, [isAdmin, searchQuery]);

  const organizations = useMemo(() => {
    if (!isAdmin) return memberOrganizations;

    const active =
      searchQuery.trim().length >= MIN_QUERY_LENGTH ? searchResults : defaultSuggestions;

    // Keep the current selection in the list: dropping it would make
    // IsolatedSelect lose the visible selection on the next search.
    return mergeById(memberOrganizations, active, selected ? [selected] : []);
  }, [defaultSuggestions, isAdmin, memberOrganizations, searchQuery, searchResults, selected]);

  useEffect(() => {
    for (const organization of organizations) {
      knownNamesRef.current.set(organization.id, organization.name);
    }
  }, [organizations]);

  const rememberSelection = useCallback((value: string) => {
    if (!value) {
      setSelected(null);
      return;
    }
    const name = knownNamesRef.current.get(value);
    setSelected(name ? { id: value, name } : null);
  }, []);

  const noResultsText = useMemo(() => {
    if (searchQuery.trim().length < MIN_QUERY_LENGTH) {
      return t("fields.producerMinChars", { count: MIN_QUERY_LENGTH });
    }
    if (isSearching) return t("fields.producerSearching");
    return t("fields.producerNoResults");
  }, [isSearching, searchQuery, t]);

  return {
    organizations,
    /** Portal admins search the whole catalogue instead of picking from a list. */
    isSearchable: isAdmin,
    noResultsText,
    onSearch: setSearchQuery,
    /** No organization to publish for, and searching is not an option. */
    hasNoEligibleOrganization: !isAdmin && !isLoadingUser && memberOrganizations.length === 0,
    rememberSelection,
  };
}
