import type { SortOrder } from "@/hooks/admin-lists/useClientTableState";

export function paginateItems<T>(items: T[], currentPage: number, pageSize: number): T[] {
  const start = (currentPage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function sortItems<T, TField extends string>(
  items: T[],
  sortField: TField | null,
  sortOrder: SortOrder,
  sorters: Partial<Record<TField, (a: T, b: T) => number>>
): T[] {
  if (!sortField || sortOrder === "none") return items;

  const sorter = sorters[sortField];
  if (!sorter) return items;

  const direction = sortOrder === "ascending" ? 1 : -1;
  return [...items].sort((a, b) => sorter(a, b) * direction);
}

export function createLocaleStringSorter<T>(
  getValue: (item: T) => string | null | undefined,
  locale = "pt"
) {
  const collator = new Intl.Collator(locale, { sensitivity: "base" });
  return (a: T, b: T) => collator.compare(getValue(a) ?? "", getValue(b) ?? "");
}

export function createDateSorter<T>(getValue: (item: T) => string | null | undefined) {
  return (a: T, b: T) => {
    const aValue = getValue(a);
    const bValue = getValue(b);
    const aTime = aValue ? Date.parse(aValue) : 0;
    const bTime = bValue ? Date.parse(bValue) : 0;
    return aTime - bTime;
  };
}

export interface ResourceStatusSortItem {
  deleted?: boolean | string | null;
  archived?: boolean | string | null;
  deleted_at?: boolean | string | null;
  archived_at?: boolean | string | null;
  private?: boolean | string | null;
}

export function getResourceStatusSortValue(item: ResourceStatusSortItem): number {
  if (item.deleted || item.deleted_at) return 3;
  if (item.archived || item.archived_at) return 2;
  if (item.private) return 1;
  return 0;
}

export function buildApiSortParam<TField extends string>(
  sortField: TField | null,
  sortOrder: SortOrder,
  sortFieldMap: Record<TField, string | null>
): string | undefined {
  if (!sortField || sortOrder === "none") return undefined;
  const apiField = sortFieldMap[sortField];
  if (!apiField) return undefined;
  return `${sortOrder === "descending" ? "-" : ""}${apiField}`;
}

