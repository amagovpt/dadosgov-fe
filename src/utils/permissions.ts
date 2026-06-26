/**
 * Read a backend-computed authorization flag off an entity.
 *
 * Authorization is decided by the backend (the single source of truth): every
 * entity is serialized with a `permissions` object (e.g. `{ edit, delete, … }`)
 * resolved for the current user. The UI must consume these flags instead of
 * re-deriving owner/role rules on the client.
 *
 * Returns `false` when the entity or the flag is absent — e.g. the entity was
 * fetched without the user's session, or the caller is anonymous.
 */
export function can(
  // `object` (not Record<string, boolean>) so the specific per-entity
  // permission interfaces (DatasetPermissions, …) are accepted without an
  // index signature.
  entity: { permissions?: object } | null | undefined,
  action: string,
): boolean {
  const permissions = entity?.permissions as Record<string, boolean> | undefined;
  return permissions?.[action] ?? false;
}
