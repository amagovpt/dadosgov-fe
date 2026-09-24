"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
  Suspense,
  use,
  useRef,
} from "react";
import { UserRef } from "@/service/types/identity";
import { fetchCurrentUser } from "@/service/api/auth";
import type { InitialSession } from "@/service/types/identity/session";

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
  // Whether the linking flow is still reachable AT ALL. Deliberately NOT the
  // same as migrationInvite: that one goes false on dismissal, and the
  // permanent entry point must survive it.
  migrationLinkAvailable: boolean;
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
  migrationLinkAvailable: false,
  isAdmin: false,
  hasOrganization: false,
  refresh: async () => {},
});

function SessionHydrator({ session, onResolve }: {
  session: Promise<InitialSession>;
  onResolve: (session: InitialSession) => void;
}) {
  const resolved = use(session);
  useEffect(() => { onResolve(resolved); }, [resolved, onResolve]);
  return null;
}

export function AuthProvider({ children, initialSession }: {
  children: ReactNode;
  initialSession?: Promise<InitialSession>;
}) {
  const [user, setUser] = useState<UserRef | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [samlLogin, setSamlLogin] = useState(false);
  const initialized = useRef(false);
  const refreshVersion = useRef(0);

  const refresh = useCallback(async () => {
    initialized.current = true;
    const version = ++refreshVersion.current;
    try {
      const currentUser = await fetchCurrentUser();
      if (version !== refreshVersion.current) return;
      setUser(currentUser);
      setSamlLogin(currentUser?.saml_login ?? false);
    } catch (error) {
      console.error("[AuthContext] Error fetching current user:", error);
    } finally {
      if (version === refreshVersion.current) setIsLoading(false);
    }
  }, []);

  const resolveSession = useCallback((session: InitialSession) => {
    // Explicit refresh (e.g. after editing an account) wins over a late initial
    // response. Also prevents Strict Mode from repeating cookie renewal.
    if (initialized.current) return;
    initialized.current = true;
    setUser(session.user);
    setSamlLogin(session.user?.saml_login ?? false);
    setIsLoading(false);
    if (session.renewCookie) void refresh();
  }, [refresh]);

  useEffect(() => {
    // refresh() only sets state after an awaited fetch, so it cannot trigger a
    // synchronous cascading render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!initialSession) void refresh();
  }, [initialSession, refresh]);

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
  const migrationLinkAvailable = user?.migration_link_available ?? false;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        samlLogin,
        pendingRegistration,
        pendingRegistrationEmail,
        migrationInvite,
        migrationLinkAvailable,
        isAdmin,
        hasOrganization,
        refresh,
      }}
    >
      {initialSession && (
        <Suspense fallback={null}>
          <SessionHydrator session={initialSession} onResolve={resolveSession} />
        </Suspense>
      )}
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
