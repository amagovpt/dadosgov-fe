"use client";

import { Accordion } from "@ama-pt/agora-design-system";
import { FaqAnswer } from "./answers";
import type { FaqItem } from "@/service/types/support";

interface FaqAccordionItemProps {
  item: FaqItem;
  currentId: string;
  expandedId: string | null;
  onExpanded: (id: string) => void;
  onCollapsed: (id: string) => void;
}

export function FaqAccordionItem({
  item,
  currentId,
  expandedId,
  onExpanded,
  onCollapsed,
}: FaqAccordionItemProps) {
  return (
    <Accordion
      key={`${currentId}-${expandedId === currentId}`}
      headingTitle={
        <span className="mr-16 font-bold text-[#2B363C]">{item.title}</span>
      }
      headingLevel="h4"
      defaultExpanded={expandedId === currentId}
      onExpanded={() => onExpanded(currentId)}
      onCollapsed={() => onCollapsed(currentId)}
    >
      <div className="mr-16 py-16 leading-relaxed text-neutral-900">
        <FaqAnswer plainAnswer={item.description ?? ""} />
      </div>
    </Accordion>
  );
}
