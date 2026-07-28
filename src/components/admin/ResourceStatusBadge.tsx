"use client";

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
}

type ResourceStatusVariant = "danger" | "neutral" | "warning" | "success";

export function ResourceStatusBadge({ item }: ResourceStatusBadgeI) {
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

  return <StatusDot variant={getStatusVariant()}>{getStatusLabel()}</StatusDot>;
}
