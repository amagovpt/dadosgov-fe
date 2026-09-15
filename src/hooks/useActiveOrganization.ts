"use client";

import { useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { Organization } from "@/service/types/identity";

export function useActiveOrganization() {
  const { user, isLoading } = useAuth();
  const { activeProfile, setActiveProfile } = useActiveProfile();
  const organizations = useMemo<Organization[]>(() => user?.organizations ?? [], [user]);

  const activeOrg = useMemo<Organization | null>(() => {
    if (organizations.length === 0) return null;
    if (activeProfile.type === "organization") {
      return organizations.find((o) => o.id === activeProfile.orgId) ?? organizations[0];
    }
    return organizations[0];
  }, [organizations, activeProfile]);

  const selectOrganization = useCallback(
    (orgId: string) => setActiveProfile({ type: "organization", orgId }),
    [setActiveProfile]
  );

  return {
    organizations,
    activeOrg,
    isLoading,
    hasOrganization: organizations.length > 0,
    selectOrganization,
  };
}
