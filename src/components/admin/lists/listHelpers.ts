import type { SortOrder } from "./useClientTableState";

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
