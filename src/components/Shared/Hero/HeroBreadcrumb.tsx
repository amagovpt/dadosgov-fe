"use client";

import React from "react";
import BreadcrumbDynamic from "@/components/Shared/BreadcrumbDynamic";

export interface IHeroBreadcrumbProps {
  /** Label overrides for intermediate dynamic segments, keyed by raw segment. */
  overrides?: Record<string, React.ReactNode>;
  /** Label for the last crumb (a CMS/API title). */
  currentLabel?: React.ReactNode;
  darkMode?: boolean;
  className?: string;
}

/**
 * Route-derived breadcrumb for the hero. Rendering the slot is what turns the
 * breadcrumb on — there is no `hasBreadcrumb` flag any more.
 *
 * Dark breadcrumbs are the default; light heroes opt out with `darkMode={false}`.
 */
export default function HeroBreadcrumb({
  overrides,
  currentLabel,
  darkMode = true,
  className,
}: IHeroBreadcrumbProps) {
  return (
    <BreadcrumbDynamic
      overrides={overrides}
      currentLabel={currentLabel}
      darkMode={darkMode}
      className={className}
    />
  );
}
