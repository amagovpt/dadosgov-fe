"use client";

import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Organization } from "@/service/types/api";

export function useActiveOrganization() {
  const { user, isLoading } = useAuth();
  const organizations = useMemo<Organization[]>(
    () => user?.organizations ?? [],
    [user],
  );
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  const activeOrg = useMemo<Organization | null>(() => {
    if (organizations.length === 0) return null;
    if (selectedOrgId) {
      return (
        organizations.find((o) => o.id === selectedOrgId) ?? organizations[0]
      );
    }
    return organizations[0];
  }, [organizations, selectedOrgId]);

  const selectOrganization = useCallback((orgId: string) => {
    setSelectedOrgId(orgId);
  }, []);

  return {
    organizations,
    activeOrg,
    isLoading,
    hasOrganization: organizations.length > 0,
    selectOrganization,
  };
}
