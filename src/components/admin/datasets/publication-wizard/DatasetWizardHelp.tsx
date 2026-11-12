"use client";

import { Accordion } from "@ama-pt/agora-design-system";
import type { AuxiliarItem } from "@/components/admin/AuxiliarList";

export function DatasetWizardHelp({
  item,
  background = "primary",
}: {
  item?: AuxiliarItem;
  background?: "primary" | "white";
}) {
  if (!item || item.hidden) return null;
  return (
    <Accordion
      className={` bg-primary-100`}
      headingTitle={item.title}
      headingLevel="h3"
      hasIcon
      leadingIcon="agora-line-info-mark"
    >
      {item.content}
    </Accordion>
  );
}
