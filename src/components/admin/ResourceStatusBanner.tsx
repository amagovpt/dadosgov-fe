"use client";

import { StatusCard } from "@ama-pt/agora-design-system";

import type { ResourceStatusItem } from "./ResourceStatusBadge";

export interface ResourceStatusBannerI {
  item: ResourceStatusItem;
  /**
   * The two sentences, supplied by the caller rather than held here, so each
   * module names its own noun -- "Este conjunto de dados", "Esta reutilizacao",
   * "Esta API". The wording differs; the RULE about which one shows does not,
   * and that rule is what this component owns.
   */
  messages: { deleted: string; archived: string };
}

/**
 * The warning that says a resource is archived or deleted, above the edit form.
 *
 * 🚩 DELETED WINS OVER ARCHIVED, and that is the whole reason this is a
 * component instead of two lines copied into three screens. A resource can
 * hold both timestamps -- archive it, then delete it -- and showing both
 * banners would tell somebody two things at once about one resource. The
 * reuses screen had already decided this, with `{!reuse.deleted && ...}`
 * written by hand; the other two modules had nothing.
 *
 * Copying that guard into two more files would have reproduced exactly the
 * defect LEDG-2554 describes: three improvised answers to one gap. It is the
 * same precedence the shared badge resolves, and the same one filterByStatus
 * uses to filter the listings.
 */
export function ResourceStatusBanner({ item, messages }: ResourceStatusBannerI) {
  // Both naming conventions, like the badge: datasets and reuses carry
  // archived/deleted, dataservices carries archived_at/deleted_at.
  const isDeleted = item.deleted || item.deleted_at;
  const isArchived = item.archived || item.archived_at;

  const description = isDeleted ? messages.deleted : isArchived ? messages.archived : null;

  if (!description) return null;

  return (
    <div className="mb-16">
      <StatusCard variant="warning" showIcon description={description} />
    </div>
  );
}
