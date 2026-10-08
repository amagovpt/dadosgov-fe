/**
 * Which date answers "when did this dataset last change".
 *
 * `last_update` is recomputed from the dataset's resources on every save, so it
 * is the one the label promises. `last_modified` is frozen at whatever it held
 * when the document was last written -- for a harvested dataset, usually its
 * creation -- which is why the detail page used to contradict its own resource
 * metadata.
 *
 * The chain rather than a bare swap, and the structural parameter rather than
 * `Dataset`: the type is shared with the homepage's lightweight payload, where
 * the field is newer than some deployed backends, and a promotion or a cache
 * window can still serve a response without it. Falling back to the old field
 * reproduces today's behaviour instead of rendering an invalid date.
 */
export function getDatasetLastUpdate(dataset: {
  last_update?: string | null;
  last_modified?: string | null;
  created_at?: string | null;
}): string | undefined {
  return dataset.last_update || dataset.last_modified || dataset.created_at || undefined;
}
