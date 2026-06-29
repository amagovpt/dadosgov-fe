import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchOrganization, fetchMembershipRequests } from "@/service/api/organizations";
import { suggestUsers } from "@/service/api/search";
import type {
  MembershipRequest,
  OrganizationMember,
  UserSuggestion,
} from "@/service/types/identity";

interface UserStatus {
  isMember: boolean;
  isPending: boolean;
}

export function useUserSearch(orgId: string) {
  const [initialSuggestions, setInitialSuggestions] = useState<UserSuggestion[]>([]);
  const [searchResults, setSearchResults] = useState<UserSuggestion[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const memberIdsRef = useRef<string[]>([]);
  const pendingUserIdsRef = useRef<string[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [users, org, requests] = await Promise.all([
          suggestUsers("", 50),
          fetchOrganization(orgId),
          fetchMembershipRequests(orgId),
        ]);
        setInitialSuggestions(users);
        memberIdsRef.current = (org?.members || []).map(
          (member: OrganizationMember) => member.user.id
        );
        pendingUserIdsRef.current = requests
          .filter((request: MembershipRequest) => request.status === "pending" && request.user)
          .map((request: MembershipRequest) => request.user.id);
      } catch (error) {
        console.error("Error loading users:", error);
      }
    }

    void loadData();
  }, [orgId]);

  useEffect(() => {
    const query = searchQuery.trim();
    let frameId: number | null = null;

    if (query.length < 2) {
      frameId = requestAnimationFrame(() => {
        setSearchResults([]);
        setIsSearching(false);
      });
      return () => {
        if (frameId !== null) cancelAnimationFrame(frameId);
      };
    }

    frameId = requestAnimationFrame(() => {
      setIsSearching(true);
    });

    const timer = setTimeout(async () => {
      try {
        const response = await suggestUsers(query, 50);
        setSearchResults(response);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const dropdownUsers = useMemo(() => {
    return searchQuery.trim().length >= 2 ? searchResults : initialSuggestions;
  }, [initialSuggestions, searchQuery, searchResults]);

  const getUserStatus = useCallback((userId: string): UserStatus => {
    const isMember = userId ? memberIdsRef.current.includes(userId) : false;
    const isPending = userId ? pendingUserIdsRef.current.includes(userId) : false;
    return { isMember, isPending };
  }, []);

  return {
    dropdownUsers,
    setSearchQuery,
    isSearching,
    getUserStatus,
  };
}
