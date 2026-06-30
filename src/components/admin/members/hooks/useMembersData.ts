import { useCallback, useEffect, useState } from "react";
import { fetchOrganization, fetchMembershipRequests } from "@/service/api/organizations";
import type {
  MembershipRequest,
  Organization,
  OrganizationMember,
} from "@/service/types/identity";

async function fetchMembersData(orgId: string) {
  const orgData = await fetchOrganization(orgId);
  let pendingRequests: MembershipRequest[] = [];

  try {
    const requests = await fetchMembershipRequests(orgId);
    pendingRequests = requests.filter(
      (request: MembershipRequest) => request.status === "pending"
    );
  } catch {
    pendingRequests = [];
  }

  return {
    viewedOrg: orgData,
    members: orgData?.members || [],
    pendingRequests,
  };
}

export function useMembersData(resolvedOrgId: string | undefined) {
  const [viewedOrg, setViewedOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [pendingRequests, setPendingRequests] = useState<MembershipRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const applyMembersData = useCallback(
    (data: Awaited<ReturnType<typeof fetchMembersData>>) => {
      setViewedOrg(data.viewedOrg);
      setMembers(data.members);
      setPendingRequests(data.pendingRequests);
    },
    []
  );

  const reload = useCallback(async () => {
    if (!resolvedOrgId) return;

    setIsLoading(true);
    try {
      const data = await fetchMembersData(resolvedOrgId);
      applyMembersData(data);
    } catch (error) {
      console.error("Error loading members:", error);
    } finally {
      setIsLoading(false);
    }
  }, [applyMembersData, resolvedOrgId]);

  useEffect(() => {
    if (!resolvedOrgId) return;

    let cancelled = false;

    void (async () => {
      window.setTimeout(() => {
        if (!cancelled) setIsLoading(true);
      }, 0);

      try {
        const data = await fetchMembersData(resolvedOrgId);
        if (!cancelled) applyMembersData(data);
      } catch (error) {
        if (!cancelled) console.error("Error loading members:", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applyMembersData, resolvedOrgId]);

  return {
    viewedOrg,
    members,
    pendingRequests,
    isLoading,
    reload,
  };
}
