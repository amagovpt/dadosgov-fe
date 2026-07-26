"use client";

import type { IconName } from "@ama-pt/agora-design-system";
import type { FoListPageNoResults } from "@/service/types/shared";
import AdminEmptyState from "@/components/admin/AdminEmptyState";

interface AdminSquidexEmptyStateProps {
  noResults?: FoListPageNoResults;
  createUrl?: string;
  createTitle?: string;
}

export default function AdminSquidexEmptyState({
  noResults,
  createUrl,
  createTitle,
}: AdminSquidexEmptyStateProps) {
  if (!noResults) return null;

  return (
    <AdminEmptyState
      icon={(noResults.icon || undefined) as IconName | undefined}
      title={noResults.title}
      description={noResults.description}
      createUrl={createUrl}
      createTitle={createTitle}
    />
  );
}
