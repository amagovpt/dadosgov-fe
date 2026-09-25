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
  /**
   * Passed through to the Pill. The admin screens shout their states
   * (ARQUIVADO) and the public pages say them plainly (Arquivado) -- that is a
   * choice of the surface, not of the state, so the caller makes it and this
   * component stays out of it.
   */
  className?: string;
  /**
   * Render nothing when the resource is simply public.
   *
   * 🚩 The public pages need this and the admin screens must not have it. A
   * public page flags EXCEPTIONS -- this is not published, this is archived,
   * this is gone -- and stamping "Público" on a page anyone can already read
   * says nothing. The admin screens are the opposite: they report the current
   * state whatever it is, which is what they have always done.
   */
  hidePublic?: boolean;
}

type ResourceStatusVariant = "danger" | "neutral" | "warning" | "success";

export function ResourceStatusBadge({
  item,
  display = "dot",
  className,
  hidePublic = false,
}: ResourceStatusBadgeI) {
  const { t } = useTranslation("admin-common");
  const isDeleted = item.deleted || item.deleted_at;
  const isArchived = item.archived || item.archived_at;

  const getStatusVariant = (): ResourceStatusVariant => {
    if (isDeleted) return "danger";
    if (isArchived) return "neutral";
    if (item.private) return "warning";
    return "success";
  };

  if (hidePublic && !isDeleted && !isArchived && !item.private) return null;

  const getStatusLabel = (): string => {
    if (isDeleted) return t("status.deleted");
    if (isArchived) return t("status.archived");
    if (item.private) return t("status.draft");
    return t("status.public");
  };

  if (display === "pill") {
    // One vocabulary, two looks: the words always come from admin-common, and
    // whether they are shouted is left to the caller's className.
    return (
      <Pill variant={getStatusVariant()} className={className}>
        {getStatusLabel()}
      </Pill>
    );
  }

  return <StatusDot variant={getStatusVariant()}>{getStatusLabel()}</StatusDot>;
}
