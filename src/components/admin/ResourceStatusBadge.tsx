"use client";

import { Pill } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";
import StatusDot from "./StatusDot";

export type ResourceStatusItem = {
  // Datasets/reuses expose archived/deleted; dataservices expose the
  // timestamp variants archived_at/deleted_at. Accept both.
  deleted?: boolean | string | null;
  archived?: boolean | string | null;
  deleted_at?: boolean | string | null;
  archived_at?: boolean | string | null;
  private?: boolean | string | null;
};

export interface ResourceStatusBadgeI {
  item: ResourceStatusItem;
  /**
   * How the resolved state is drawn. The listings use the dot; the edit
   * screens use a Pill, because there the state sits in a row of other Pills
   * (DESTAQUE, the dataset badges) and a lone dot among them would read as a
   * different kind of thing.
   *
   * 🚩 Named `display` and NOT `appearance`: the Agora Pill and Button both
   * carry an `appearance` prop meaning solid/outline/icon, so that name here
   * would read as the design system's and mean something else.
   */
  display?: "dot" | "pill";
}

type ResourceStatusVariant = "danger" | "neutral" | "warning" | "success";

export function ResourceStatusBadge({ item, display = "dot" }: ResourceStatusBadgeI) {
  const { t } = useTranslation("admin-common");
  const isDeleted = item.deleted || item.deleted_at;
  const isArchived = item.archived || item.archived_at;

  const getStatusVariant = (): ResourceStatusVariant => {
    if (isDeleted) return "danger";
    if (isArchived) return "neutral";
    if (item.private) return "warning";
    return "success";
  };

  const getStatusLabel = (): string => {
    if (isDeleted) return t("status.deleted");
    if (isArchived) return t("status.archived");
    if (item.private) return t("status.draft");
    return t("status.public");
  };

  if (display === "pill") {
    // Uppercased in CSS rather than in the translations: the words come from
    // admin-common, which the listings render in sentence case, and the edit
    // screens have always shown them shouted. One vocabulary, two looks.
    return (
      <Pill variant={getStatusVariant()} className="uppercase">
        {getStatusLabel()}
      </Pill>
    );
  }

  return <StatusDot variant={getStatusVariant()}>{getStatusLabel()}</StatusDot>;
}
