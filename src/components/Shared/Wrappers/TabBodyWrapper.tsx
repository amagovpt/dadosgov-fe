"use client";

import { TabBody } from "@ama-pt/agora-design-system";
import { ReactNode } from "react";

interface TabBodyWrapperProps {
  children: ReactNode;
  bleedClassName?: string;
}

export function TabBodyWrapper({
  children,
  bleedClassName = "bg-primary-100",
}: TabBodyWrapperProps) {
  return (
    <TabBody>
      <div className="relative">
        <div
          className={`absolute inset-y-0 z-0 -mx-4 sm:-mx-8 md:-mx-16 lg:-mx-32 xl:-mx-64 ${bleedClassName}`}
          aria-hidden="true"
        />
        <div className="relative z-10">
          <div className="container">{children}</div>
        </div>
      </div>
    </TabBody>
  );
}
