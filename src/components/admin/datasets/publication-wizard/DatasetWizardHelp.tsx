"use client";

import { Accordion } from "@ama-pt/agora-design-system";
import type { AuxiliarItem } from "@/components/admin/AuxiliarList";
import styles from "./datasetWizard.module.css";

export function DatasetWizardHelp({ item }: { item?: AuxiliarItem }) {
  if (!item || item.hidden) return null;
  return (
    <Accordion
      className={styles.help}
      headingTitle={item.title}
      headingLevel="h3"
      hasIcon
      leadingIcon="agora-line-info-mark"
    >
      {item.content}
    </Accordion>
  );
}
