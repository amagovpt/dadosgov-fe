export type StatusFilter = "public" | "draft" | "archived" | "deleted";

export interface StatusFilterable {
  private?: boolean | string | null;
  archived?: boolean | string | null;
  deleted?: boolean | string | null;
}

export function filterByStatus<T extends StatusFilterable>(
  items: T[],
  statusFilter?: StatusFilter | string
): T[] {
  if (!statusFilter) return items;

  return items.filter((item) => {
    switch (statusFilter) {
      case "public":
        return !item.private && !item.archived && !item.deleted;
      case "draft":
        return !!item.private && !item.archived && !item.deleted;
      case "archived":
        return !!item.archived && !item.deleted;
      case "deleted":
        return !!item.deleted;
      default:
        return true;
    }
  });
}
