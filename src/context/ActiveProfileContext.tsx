"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { useParams, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { stripLocale } from "@/utils/stripLocale";
import { fetchOrganization } from "@/service/api/organizations";
import type { Organization } from "@/service/types/identity";

export type ActiveProfile =
  | { type: "personal" }
  | { type: "organization"; orgId: string }
  | { type: "system" };

export function isSameProfile(a: ActiveProfile, b: ActiveProfile): boolean {
  if (a.type !== b.type) return false;
  if (a.type === "organization" && b.type === "organization") return a.orgId === b.orgId;
  return true;
}

/** The route prefix a profile's admin pages live under. */
export function adminProfileBasePath(profile: ActiveProfile): string {
  if (profile.type === "organization") return `/admin/org/${profile.orgId}`;
  if (profile.type === "system") return "/admin/system";
  return "/admin/me";
}

interface ActiveProfileContextProps {
  activeProfile: ActiveProfile;
  isLoading: boolean;
  organizations: Organization[];
}

const PERSONAL_PROFILE: ActiveProfile = { type: "personal" };

type ProfilePreference = { userId: string; profile: ActiveProfile };

// Per tab, so two tabs can work in different profiles; it ends with the tab.
const ACTIVE_PROFILE_STORAGE_KEY = "admin-active-profile";

function readStoredPreference(): ProfilePreference | null {
  try {
    const raw = sessionStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ProfilePreference>;
    const profile = parsed?.profile as Partial<Record<string, unknown>> | undefined;
    if (typeof parsed?.userId !== "string" || !profile) return null;
    if (profile.type === "personal" || profile.type === "system") {
      return { userId: parsed.userId, profile: { type: profile.type } };
    }
    if (profile.type === "organization" && typeof profile.orgId === "string") {
      return { userId: parsed.userId, profile: { type: "organization", orgId: profile.orgId } };
    }
  } catch {
    // Storage unavailable or corrupt: start from the default profile.
  }
  return null;
}

function writeStoredPreference(preference: ProfilePreference | null) {
  try {
    if (preference) {
      sessionStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, JSON.stringify(preference));
    } else {
      sessionStorage.removeItem(ACTIVE_PROFILE_STORAGE_KEY);
    }
  } catch {
    // Storage unavailable: the preference still lives in memory for this page.
  }
}

const ActiveProfileContext = createContext<ActiveProfileContextProps>({
  activeProfile: PERSONAL_PROFILE,
  isLoading: true,
  organizations: [],
});

export function ActiveProfileProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin, isLoading: isAuthLoading } = useAuth();
  const pathname = stripLocale(usePathname());
  const params = useParams<{ orgId?: string }>();
  const routeOrgId = params?.orgId;
  const userId = user?.id;
  const [visited, setVisited] = useState<{
    userId: string;
    organizations: Record<string, Organization | null>;
  } | null>(null);
  const [preference, setPreference] = useState<ProfilePreference | null>(null);
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    // Read after mount, not in the initializer: the server has no sessionStorage and
    // a different first render would not hydrate.
    const stored = readStoredPreference();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setPreference(stored);
    setRestored(true);
  }, []);
  useEffect(() => {
    // Visited profiles belong only to the current account and admin session.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisited(null);
  }, [userId, isAdmin]);

  const activeProfile = useMemo<ActiveProfile>(() => {
    if (!user) return PERSONAL_PROFILE;

    const validate = (profile: ActiveProfile): ActiveProfile => {
      if (profile.type === "system" && !isAdmin) return PERSONAL_PROFILE;
      if (
        profile.type === "organization" &&
        !isAdmin &&
        !user.organizations?.some((org) => org.id === profile.orgId)
      ) {
        return PERSONAL_PROFILE;
      }
      return profile;
    };

    // Explicit routes take precedence, including direct links and browser Back/Forward.
    if (pathname === "/admin/me" || pathname.startsWith("/admin/me/")) return PERSONAL_PROFILE;
    if (pathname === "/admin/system" || pathname.startsWith("/admin/system/")) {
      return validate({ type: "system" });
    }

    const saved = validate(
      preference && preference.userId === userId ? preference.profile : PERSONAL_PROFILE
    );
    if (pathname === "/admin/org" || pathname.startsWith("/admin/org/")) {
      if (routeOrgId) return validate({ type: "organization", orgId: routeOrgId });
      if (isAuthLoading) return PERSONAL_PROFILE;
      if (saved.type === "organization") return saved;
      const firstOrg = user.organizations?.[0];
      return firstOrg ? { type: "organization", orgId: firstOrg.id } : PERSONAL_PROFILE;
    }
    return saved;
  }, [user, isAdmin, pathname, routeOrgId, preference, userId, isAuthLoading]);

  // System administrators can open organizations they do not belong to. Only
  // the active one is added to their membership list; cached details can be reused.
  const externalOrgId =
    isAdmin &&
    activeProfile.type === "organization" &&
    !user?.organizations?.some((org) => org.id === activeProfile.orgId)
      ? activeProfile.orgId
      : null;
  const organizations = useMemo(() => {
    const memberships = user?.organizations ?? [];
    const activeExternalOrganization =
      externalOrgId && visited && visited.userId === userId
        ? visited.organizations[externalOrgId]
        : null;
    return activeExternalOrganization ? [...memberships, activeExternalOrganization] : memberships;
  }, [user, userId, externalOrgId, visited]);

  const hasResolvedOrganization =
    externalOrgId !== null &&
    visited !== null &&
    visited.userId === userId &&
    Object.hasOwn(visited.organizations, externalOrgId);
  const isLoading =
    !restored || isAuthLoading || (externalOrgId !== null && !hasResolvedOrganization);

  useEffect(() => {
    if (!externalOrgId || !userId || isAuthLoading || hasResolvedOrganization) return;
    let cancelled = false;
    const remember = (org: Organization | null) => {
      if (cancelled) return;
      setVisited((previous) => ({
        userId,
        organizations: {
          ...(previous?.userId === userId ? previous.organizations : {}),
          [externalOrgId]: org,
        },
      }));
    };
    fetchOrganization(externalOrgId)
      .then(remember)
      .catch(() => remember(null));
    return () => {
      cancelled = true;
    };
  }, [externalOrgId, userId, isAuthLoading, hasResolvedOrganization]);

  useEffect(() => {
    if (!restored) return;
    if (!userId) {
      // Only a settled "no user" is a logout; while auth resolves, keep what was restored.
      if (isAuthLoading) return;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreference(null);
      writeStoredPreference(null);
    } else if (
      !isLoading &&
      (preference?.userId !== userId || !isSameProfile(preference.profile, activeProfile))
    ) {
      // Remember the resolved route per tab (sessionStorage) for visits to an unscoped
      // route, so a reload there keeps the profile. `validate()` still vets it on read.
      const next = { userId, profile: activeProfile };
      setPreference(next);
      writeStoredPreference(next);
    }
  }, [activeProfile, isAuthLoading, isLoading, preference, restored, userId]);

  const value = useMemo(
    () => ({ activeProfile, isLoading, organizations }),
    [activeProfile, isLoading, organizations]
  );

  return <ActiveProfileContext.Provider value={value}>{children}</ActiveProfileContext.Provider>;
}

export const useActiveProfile = () => useContext(ActiveProfileContext);
