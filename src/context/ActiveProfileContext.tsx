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
import { useAuth } from "@/context/AuthContext";

export type ActiveProfile =
  | { type: "personal" }
  | { type: "organization"; orgId: string }
  | { type: "system" };

export function isSameProfile(a: ActiveProfile, b: ActiveProfile): boolean {
  if (a.type !== b.type) return false;
  if (a.type === "organization" && b.type === "organization") return a.orgId === b.orgId;
  return true;
}

interface ActiveProfileContextProps {
  activeProfile: ActiveProfile;
  setActiveProfile: (profile: ActiveProfile) => void;
}

const STORAGE_KEY = "dadosgov.activeProfile";

const ActiveProfileContext = createContext<ActiveProfileContextProps>({
  activeProfile: { type: "personal" },
  setActiveProfile: () => {},
});

function readStoredProfile(): ActiveProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ActiveProfile) : null;
  } catch {
    return null;
  }
}

export function ActiveProfileProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin } = useAuth();
  const [activeProfile, setActiveProfileState] = useState<ActiveProfile>({ type: "personal" });

  useEffect(() => {
    if (!user) return;
    const stored = readStoredProfile();
    if (!stored) return;
    if (stored.type === "organization" && !user.organizations?.some((o) => o.id === stored.orgId)) {
      return;
    }
    if (stored.type === "system" && !isAdmin) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveProfileState(stored);
  }, [user, isAdmin]);

  const setActiveProfile = useCallback((profile: ActiveProfile) => {
    setActiveProfileState(profile);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
    }
  }, []);

  const value = useMemo(
    () => ({ activeProfile, setActiveProfile }),
    [activeProfile, setActiveProfile]
  );

  return <ActiveProfileContext.Provider value={value}>{children}</ActiveProfileContext.Provider>;
}

export const useActiveProfile = () => useContext(ActiveProfileContext);
