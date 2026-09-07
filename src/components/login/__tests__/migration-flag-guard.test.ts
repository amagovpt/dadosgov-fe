/**
 * LEDG-2432, acceptance criterion 4: the migration notice must appear because
 * the backend said so, never because the frontend read a flag.
 *
 * This is a source check rather than a render test, and deliberately so. The
 * behavioural tests next to this file drive everything through props and
 * through the @/service/api/auth module, so they would stay green if someone
 * reintroduced a `process.env.NEXT_PUBLIC_MIGRATION_*` read — the render looks
 * the same either way. Nothing observable from the DOM distinguishes "the
 * backend told us" from "we guessed from configuration", which is exactly how
 * 7d5c9b50 removed the sign-in form without a test turning red.
 *
 * Same reasoning as the raw-HTML-sink guard in src/app/__tests__/i18n.test.tsx
 * (LEDG-2376): when the invariant is about what the code does NOT do, the
 * source is the only place to assert it.
 */

import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The two components that decide what the email tab shows. If either starts
 * reading a migration flag, the tab stops working in one of the flag's two
 * states — and which one breaks depends on which value was assumed.
 */
const GUARDED = [
  "src/components/login/EmailTab.tsx",
  "src/components/login/LoginContent.tsx",
];

/**
 * Any spelling of the flag that could reach the browser. NEXT_PUBLIC_ is the
 * only prefix Next.js inlines into client bundles, so it is the realistic
 * shape; MIGRATION_MODE is the backend's own name for it, and would be a
 * plausible copy-paste.
 */
const FLAG_READ = /MIGRATION_MODE|NEXT_PUBLIC_MIGRATION/;

describe("the email tab never decides migration from a frontend flag", () => {
  it.each(GUARDED)("%s reads no migration flag", (relative) => {
    const source = readFileSync(path.join(process.cwd(), relative), "utf8");

    // The word may appear in a comment explaining why it is not read — strip
    // comments before asserting, so the explanation is allowed to exist.
    const code = source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^[ \t]*\/\/.*$/gm, "");

    expect(code).not.toMatch(FLAG_READ);
  });

  it("still reacts to the backend's answer, which is the supported mechanism", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/components/login/LoginContent.tsx"),
      "utf8"
    );

    // Paired with the assertion above: proving the flag is absent is only
    // meaningful while the backend-driven path is present. Delete the handler
    // and the tab would satisfy the guard by doing nothing at all.
    expect(source).toContain('message === "migration_required"');
  });
});
