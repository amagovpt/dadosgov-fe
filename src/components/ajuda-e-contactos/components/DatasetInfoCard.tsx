"use client";

import { StatusCard } from "@ama-pt/agora-design-system";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import type { SupportCardContent } from "@/service/types/support";

interface DatasetInfoCardProps {
  cards: SupportCardContent[];
}

export function DatasetInfoCard({ cards }: DatasetInfoCardProps) {
  return (
    <div className="mt-32 flex max-w-2xl flex-col gap-32">
      {cards.map((card, index) => (
        <StatusCard
          key={`${card.title ?? "dataset-info"}-${index}`}
          variant="informative"
          showIcon
          description={
            <div className="flex flex-col gap-8">
              {card.title ? <p className="font-bold">{card.title}</p> : null}
              {formatHtmlParagraphs(card.description ?? "")}
            </div>
          }
        />
      ))}
    </div>
  );
}
