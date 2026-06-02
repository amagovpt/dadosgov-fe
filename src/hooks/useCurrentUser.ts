"use client";

import { useEffect, useState } from "react";
import { fetchCurrentUser } from "@/services/api";
import { UserRef } from "@/types/api";

export function useCurrentUser() {
  const [user, setUser] = useState<UserRef | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchCurrentUser();
        setUser(data);
      } catch {
        setUser(null);
      }
    }
    load();
  }, []);

  const displayName = user
    ? `${user.first_name} ${user.last_name}`
    : "";

  return { user, displayName };
}
