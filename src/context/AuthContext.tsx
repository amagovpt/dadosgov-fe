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
  // True while the account still has a saml-* placeholder email: the user
  // must provide a real email on /complete-registration before browsing.
  pendingRegistration: boolean;
  pendingRegistrationEmail: string | null;
  // The optional CMD/eIDAS linking invite, as decided by the backend for this
  // account. Read here, never derived: see UserRef.migration_invite.
  migrationInvite: boolean;
  isAdmin: boolean;
  hasOrganization: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  isLoading: true,
  samlLogin: false,
  pendingRegistration: false,
  pendingRegistrationEmail: null,
  migrationInvite: false,
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

  const pendingRegistration = user?.pending_registration ?? false;
  // ?? null, not ?? "": an older backend omits the field entirely, and the
  // screen must then behave exactly as it did before rather than prefill an
  // empty string over whatever the user may already be typing.
  const pendingRegistrationEmail = user?.pending_registration_email ?? null;
  // ?? false: an older backend omits the field, and no invite is the correct
  // behaviour then. The value is the backend's answer for THIS account and is
  // never combined with anything read here.
  const migrationInvite = user?.migration_invite ?? false;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        samlLogin,
        pendingRegistration,
        pendingRegistrationEmail,
        migrationInvite,
        isAdmin,
        hasOrganization,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
