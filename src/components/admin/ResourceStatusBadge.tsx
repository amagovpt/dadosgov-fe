"use client";

import StatusDot from "./StatusDot";

export type ResourceStatusItem = {
  deleted?: boolean | string | null;
  archived?: boolean | string | null;
  private?: boolean | string | null;
};

export interface ResourceStatusBadgeI {
  item: ResourceStatusItem;
}

type ResourceStatusVariant = "danger" | "neutral" | "warning" | "success";

export function ResourceStatusBadge({ item }: ResourceStatusBadgeI) {
  const getStatusVariant = (): ResourceStatusVariant => {
    if (item.deleted) return "danger";
    if (item.archived) return "neutral";
    if (item.private) return "warning";
    return "success";
  };

  const getStatusLabel = (): string => {
    if (item.deleted) return "Excluído";
    if (item.archived) return "Arquivado";
    if (item.private) return "Rascunho";
    return "Público";
  };

  return <StatusDot variant={getStatusVariant()}>{getStatusLabel()}</StatusDot>;
}
