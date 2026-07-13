"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { UserRef } from "@/service/types/identity";
import { fetchCurrentUser } from "@/service/api/auth";

interface AuthContextProps {
  user: UserRef | null;
  isLoading: boolean;
  samlLogin: boolean;
  isAdmin: boolean;
  hasOrganization: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  isLoading: true,
  samlLogin: false,
  isAdmin: false,
  hasOrganization: false,
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserRef | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [samlLogin, setSamlLogin] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
      setSamlLogin(currentUser?.saml_login ?? false);
    } catch (error) {
      console.error("[AuthContext] Error fetching current user:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // refresh() only sets state after an awaited fetch, so it cannot trigger a
    // synchronous cascading render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const isAdmin = useMemo(
    () => user?.roles?.includes("admin") ?? false,
    [user],
  );

  const hasOrganization = useMemo(
    () => (user?.organizations?.length ?? 0) > 0,
    [user],
  );

  return (
    <AuthContext.Provider
      value={{ user, isLoading, samlLogin, isAdmin, hasOrganization, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
