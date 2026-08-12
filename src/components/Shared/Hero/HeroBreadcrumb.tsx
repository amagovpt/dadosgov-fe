"use client";

import React from "react";
import BreadcrumbDynamic from "@/components/Shared/BreadcrumbDynamic";

export interface IHeroBreadcrumbProps {
  /** Label overrides for intermediate dynamic segments, keyed by raw segment. */
  overrides?: Record<string, React.ReactNode>;
  /** Label for the last crumb (a CMS/API title). */
  currentLabel?: React.ReactNode;
  className?: string;
}

/**
 * Route-derived breadcrumb for the hero. Rendering the slot is what turns the
 * breadcrumb on — there is no `hasBreadcrumb` flag any more.
 *
 * `darkMode` is deliberately not forwarded: the hero band is always
 * `bg-primary-900`, and `BreadcrumbDynamic` already defaults to dark.
 */
export default function HeroBreadcrumb({
  overrides,
  currentLabel,
  className,
}: IHeroBreadcrumbProps) {
  return (
    <BreadcrumbDynamic overrides={overrides} currentLabel={currentLabel} className={className} />
  );
}
