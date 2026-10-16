/**
 * When did anything about this dataset last change.
 *
 * Neither field answers that on its own, and each is stale in the opposite
 * direction:
 *
 * - `last_modified` freezes at the value the document carried when it was last
 *   written. A harvest that brings no modification date of its own never moves
 *   it, so the dataset reports its creation date while its files change.
 * - `last_update` is recomputed from the resources only in `clean()`, and the
 *   three resource mutators — add, update, remove — write through an atomic
 *   update that skips it. Those are what the API calls when a publisher uploads
 *   a file, so a dataset can gain a resource today and still carry a year-old
 *   `last_update`.
 *
 * Taking the most recent of the two is right in both directions, and reads the
 * way the label does: the newest signal we have that something changed. The
 * creation date closes the chain so there is always an answer.
 */
export function getDatasetLastUpdate(dataset: {
  last_update?: string | null;
  last_modified?: string | null;
  created_at?: string | null;
}): string | undefined {
  const dated = [dataset.last_update, dataset.last_modified, dataset.created_at]
    .filter((value): value is string => Boolean(value))
    .map((value) => ({ value, time: new Date(value).getTime() }))
    .filter(({ time }) => !Number.isNaN(time));

  if (dated.length === 0) return undefined;

  return dated.reduce((newest, candidate) =>
    candidate.time > newest.time ? candidate : newest
  ).value;
}
