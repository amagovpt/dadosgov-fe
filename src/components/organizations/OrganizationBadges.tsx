"use client";

import { Pill } from "@ama-pt/agora-design-system";
import type { Badge } from "@/service/types/identity";
import { ORGANIZATION_BADGE_META, organizationBadgeLabel } from "@/utils/organizationBadges";

interface OrganizationBadgesProps {
  badges?: Badge[];
  className?: string;
}

/**
 * Renders the organization's badges (etiquetas) assigned in the backoffice
 * as labelled pills, so they are visible in the frontoffice.
 */
export function OrganizationBadges({ badges, className }: OrganizationBadgesProps) {
  if (!badges || badges.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-8 ${className ?? ""}`}>
      {badges.map((badge) => {
        const meta = ORGANIZATION_BADGE_META[badge.kind];
        return (
          <Pill key={badge.kind} appearance="solid" variant={meta?.variant ?? "neutral"}>
            {organizationBadgeLabel(badge.kind)}
          </Pill>
        );
      })}
    </div>
  );
}
