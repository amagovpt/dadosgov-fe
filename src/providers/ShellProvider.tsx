"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { HeaderNavigationData } from "@/service/types/header";

const ShellContext = createContext<HeaderNavigationData | null>(null);

export function ShellProvider({
  headerNavigation,
  children,
}: {
  headerNavigation: HeaderNavigationData;
  children: ReactNode;
}) {
  return <ShellContext.Provider value={headerNavigation}>{children}</ShellContext.Provider>;
}

export function useHeaderNavigation(): HeaderNavigationData {
  return useContext(ShellContext) ?? ({} as HeaderNavigationData);
}
