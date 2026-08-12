import React from "react";
import { twMerge } from "tailwind-merge";

export interface IHeroActionsProps {
  children?: React.ReactNode;
  className?: string;
}

export default function HeroActions({ children, className }: IHeroActionsProps) {
  if (!children) return null;

  return (
    <div
      className={twMerge(
        "container grid gap-32 px-4 xs:grid-cols-4 md:grid-cols-8 xl:grid-cols-12",
        className
      )}
      data-testid="hero-actions"
    >
      <div className="xs:col-span-4 md:col-span-7 xl:col-span-7">{children}</div>
    </div>
  );
}
