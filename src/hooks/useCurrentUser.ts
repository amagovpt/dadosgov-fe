"use client";

import { useAuth } from "@/context/AuthContext";

export function useCurrentUser() {
  const { user } = useAuth();

  const displayName = user ? `${user.first_name} ${user.last_name}` : "";

  return { user, displayName };
}
