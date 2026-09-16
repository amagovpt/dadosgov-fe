"use client";

import { type ReactNode } from "react";
import { HeaderWrapper } from "@/components/HeaderWrapper";
import { useHeaderNavigation } from "@/providers/ShellProvider";

export function PortalErrorFrame({ children }: { children: ReactNode }) {
  const headerNavigation = useHeaderNavigation();

  return (
    <div className="flex w-full flex-col">
      <HeaderWrapper data={headerNavigation} />
      {children}
    </div>
  );
}
