import React from "react";
import { twMerge } from "tailwind-merge";

export interface IHeroContentProps {
  children?: React.ReactNode;
  className?: string;
}

/**
 * Groups the title and description. Carries the measure (`max-w-2xl`) and the
 * tight `gap-16` between them, as opposed to the `gap-64` the root uses to
 * separate the breadcrumb from the content.
 */
export default function HeroContent({ children, className }: IHeroContentProps) {
  return (
    <div
      className={twMerge("flex max-w-2xl flex-col gap-16", className)}
      data-testid="hero-content"
    >
      {children}
    </div>
  );
}
