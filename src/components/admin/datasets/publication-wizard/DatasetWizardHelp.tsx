"use client";

import { Accordion } from "@ama-pt/agora-design-system";
import type { AuxiliarItem } from "@/components/admin/AuxiliarList";

export function DatasetWizardHelp({ item }: { item?: AuxiliarItem }) {
  if (!item || item.hidden) return null;
  return (
    <Accordion
      className="w-full border-b border-neutral-700 bg-primary-100 [&_.accordion-header]:p-32 [&_.accordion-header_.title]:text-m-bold [&_[class*='auxiliar-list']]:p-0 [&_[class*='auxiliar-list']]:text-m-regular [&_[class*='auxiliar-list']]:text-neutral-900"
      headingTitle={item.title}
      headingLevel="h3"
      hasIcon
      leadingIcon="agora-line-info-mark"
    >
      {item.content}
    </Accordion>
  );
}
