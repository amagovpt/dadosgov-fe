"use client";

import {
  Breadcrumb as ADSBreadcrumb,
  BreadcrumbProps,
} from "@ama-pt/agora-design-system";
import { sanitizeBreadcrumbItems } from "@/utils/breadcrumbs";

interface ProjectBreadcrumbProps extends BreadcrumbProps {
  validateUrls?: boolean;
}

export default function Breadcrumb({ validateUrls = true, items, ...rest }: ProjectBreadcrumbProps) {
  const safeItems = validateUrls ? sanitizeBreadcrumbItems(items) : items;
  return <ADSBreadcrumb {...rest} items={safeItems} />;
}
