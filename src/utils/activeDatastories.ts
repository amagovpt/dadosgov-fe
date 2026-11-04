/** A datastory reference flattened from `data { isActive { iv } metadata { … } }`. */
export type DatastoryRef<T> = { isActive?: boolean | null; metadata: T };

/**
 * Drops datastories switched off in the CMS (`isActive: false`); unset counts as active.
 * Filtered here rather than with a Squidex `filter:` because the CMS filters on the stored value,
 * which is empty for contents saved before the field existed even though the API reads them as
 * `true`.
 */
export function activeDatastories<T>(refs: DatastoryRef<T>[] | undefined): T[] {
  return (refs ?? []).filter((ref) => ref?.isActive !== false).map((ref) => ref.metadata);
}
