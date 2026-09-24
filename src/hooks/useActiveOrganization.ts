"use client";

import { useMemo } from "react";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { Organization } from "@/service/types/identity";

export function useActiveOrganization() {
  const { activeProfile, isLoading, organizations } = useActiveProfile();

  const activeOrg = useMemo<Organization | null>(() => {
    if (isLoading || activeProfile.type !== "organization") return null;
    return organizations.find((o) => o.id === activeProfile.orgId) ?? null;
  }, [organizations, activeProfile, isLoading]);

  return {
    organizations,
    activeOrg,
    isLoading,
    hasOrganization: organizations.length > 0,
  };
}
