"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import Breadcrumb from "@/components/Primitives/Breadcrumb/Breadcrumb";
import { buildBreadcrumbItems } from "@/utils/breadcrumbs";

interface BreadcrumbDynamicProps {
  /** Override the derived path. Defaults to the current `usePathname()`. */
  path?: string;
  /**
   * Per-segment label overrides keyed by the raw segment (e.g. a dataset id →
   * its title) for routes whose slug is a dynamic id.
   */
  overrides?: Record<string, React.ReactNode>;
  /**
   * Label for the last crumb, whatever the segment turns out to be. Prefer this
   * over `overrides` on detail routes: the URL may carry a slug or an id, so a
   * value-keyed override silently misses.
   */
  currentLabel?: React.ReactNode;
  /** Prepend the Home crumb. Default `true`. */
  includeHome?: boolean;
  /** i18n namespace used to resolve segment labels. Default `"common"`. */
  namespace?: string;
  /** Dark mode (breadcrumbs usually sit on the dark hero). Default `true`. */
  darkMode?: boolean;
  className?: string;
  /** Section title — only visible on mobile resolutions (ADS). */
  sectionTitle?: React.ReactNode;
}

export default function BreadcrumbDynamic({
  path,
  overrides,
  currentLabel,
  includeHome = true,
  namespace = "common",
  darkMode = true,
  className,
  sectionTitle,
}: BreadcrumbDynamicProps) {
  const { t } = useTranslation(namespace);
  const pathname = usePathname();

  const items = buildBreadcrumbItems({
    path: path ?? pathname ?? "/",
    t,
    overrides,
    currentLabel,
    includeHome,
  });

  return (
    <Breadcrumb
      items={items}
      darkMode={darkMode}
      className={className}
      sectionTitle={sectionTitle}
    />
  );
}
