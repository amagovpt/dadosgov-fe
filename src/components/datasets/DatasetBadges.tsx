"use client";

import { Pill } from "@ama-pt/agora-design-system";
import type { Badge } from "@/service/types/identity";

interface DatasetBadgesProps {
  badges?: Badge[];
  className?: string;
}

export function DatasetBadges({ badges, className }: DatasetBadgesProps) {
  if (!badges || badges.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-8 ${className ?? ""}`}>
      {badges.map((badge) => (
        <Pill key={badge.kind} appearance="outline" variant="neutral">
          {badge.kind}
        </Pill>
      ))}
    </div>
  );
}
