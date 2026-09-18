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

interface ActiveProfileContextProps {
  activeProfile: ActiveProfile;
  isLoading: boolean;
  organizations: Organization[];
}

const PERSONAL_PROFILE: ActiveProfile = { type: "personal" };

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
  const [preference, setPreference] = useState<{
    userId: string;
    profile: ActiveProfile;
  } | null>(null);
  const organizations = useMemo(() => {
    const memberships = user?.organizations ?? [];
    const additional =
      isAdmin && visited !== null && visited.userId === userId
        ? Object.values(visited.organizations).filter(
            (org): org is Organization =>
              !!org && !memberships.some((memberOrg) => memberOrg.id === org.id)
          )
        : [];
    return [...memberships, ...additional];
  }, [user, isAdmin, visited, userId]);

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

  // System administrators can open organizations they do not belong to. Keep
  // those visited organizations available to both the selector and org pages.
  const externalOrgId =
    isAdmin &&
    activeProfile.type === "organization" &&
    !user?.organizations?.some((org) => org.id === activeProfile.orgId)
      ? activeProfile.orgId
      : null;
  const hasResolvedOrganization =
    externalOrgId !== null &&
    visited !== null &&
    visited.userId === userId &&
    Object.hasOwn(visited.organizations, externalOrgId);
  const isLoading = isAuthLoading || (externalOrgId !== null && !hasResolvedOrganization);

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
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreference(null);
    } else if (
      !isLoading &&
      (preference?.userId !== userId || !isSameProfile(preference.profile, activeProfile))
    ) {
      // Remember the resolved route in memory for visits to an unscoped route.
      setPreference({ userId, profile: activeProfile });
    }
  }, [activeProfile, isLoading, preference, userId]);

  const value = useMemo(
    () => ({ activeProfile, isLoading, organizations }),
    [activeProfile, isLoading, organizations]
  );

  return <ActiveProfileContext.Provider value={value}>{children}</ActiveProfileContext.Provider>;
}

export const useActiveProfile = () => useContext(ActiveProfileContext);
