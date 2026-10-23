// Trimmed, non-empty, deduplicated and sorted in Portuguese order (filter options lists)
function toSortedUnique(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => value.length > 0)
    )
  ).sort((a, b) => a.localeCompare(b, "pt"));
}

export { toSortedUnique };
