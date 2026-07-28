"use client";

import { StatusCard } from "@ama-pt/agora-design-system";
import type { AdminHelpBlock } from "@/service/types/admin/common";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

interface HarvestersAcceptedStatusInfoCardProps {
  content: AdminHelpBlock;
}

export default function HarvestersAcceptedStatusInfoCard({
  content,
}: HarvestersAcceptedStatusInfoCardProps) {
  return (
    <div className="mb-24">
      <StatusCard
        variant="informative"
        showIcon
        description={
          content.title ? (
            <>
              <strong>{content.title}</strong>
              <br />
              {formatHtmlParagraphs(content.description)}
            </>
          ) : (
            formatHtmlParagraphs(content.description)
          )
        }
      />
    </div>
  );
}
