/**
 * Stub for `server-only` under Vitest.
 *
 * `server-only` is not a package in node_modules: Next.js resolves it during
 * its own build to fail a client bundle that imports a server module. Vitest
 * has no such resolution, so any module carrying the guard was untestable --
 * the import failed before a single assertion ran. Mapping it to this empty
 * module keeps the guard where it belongs (in the Next build) and lets the
 * server code be exercised in tests.
 */
export {};
