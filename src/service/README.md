# Service Layer Migration

This folder mirrors the reference architecture:

- `src/api/*`: public, feature-facing API functions consumed by app code
- `src/service/queries/*`: read/query modules
- `src/service/mutation/*`: write/mutation modules
- `src/service/types/*`: service/domain types
- `src/service/utils/*`: shared utilities and clients

## Current status

Wave 1 (scaffolding + compatibility) is complete:

- New `src/api/*` entrypoints were created as compatibility re-exports.
- New `src/service/*` folders were created with bridge exports to existing files.
- Existing imports continue working; no runtime behavior should change.

## Next waves

1. Move implementation from `src/services/api.ts` into `src/api/*` by domain.
2. Move shared HTTP/query/error helpers into `src/service/utils/*`.
3. Migrate imports from `@/services/api` to `@/api/*` in feature slices.
4. Remove compatibility bridges after all consumers are migrated.

