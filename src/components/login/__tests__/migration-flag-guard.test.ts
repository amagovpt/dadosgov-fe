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

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Every component in the login tree, not a hand-picked pair. The review of this
 * ticket pointed out the obvious hole in listing two files: the flag could be
 * read in LoginClient (the direct parent), in EmailLoginForm, or in constants,
 * and passed down as a prop — same regression, guard untouched.
 */
const LOGIN_DIR = "src/components/login";
const GUARDED = readdirSync(path.join(process.cwd(), LOGIN_DIR))
  .filter((name) => /\.tsx?$/.test(name))
  .map((name) => `${LOGIN_DIR}/${name}`);

/**
 * The environment variables the login tree is allowed to read. Asserting the
 * exact set, rather than banning a spelling of one name, is what makes this a
 * guard instead of a reminder: any new configuration read in this tree fails
 * here and has to be justified in review — including a migration flag under a
 * name nobody has thought of yet (NEXT_PUBLIC_FORCE_CMD_ONLY, and so on).
 *
 * Both entries are deliberate and neither decides migration:
 *  - NEXT_PUBLIC_SAML_ENABLED says whether SAML is wired up at all, so whether
 *    a button can work. Whether an *account* must migrate is a different
 *    question, and it belongs to the backend, per account.
 *  - NEXT_PUBLIC_RECAPTCHA_SITE_KEY is a public site key.
 */
const ALLOWED_ENV = ["NEXT_PUBLIC_RECAPTCHA_SITE_KEY", "NEXT_PUBLIC_SAML_ENABLED"];

/** Every process.env.X read in a file, by variable name. */
function envReads(source: string): string[] {
  // Comments may discuss a flag to explain why it is not read, so strip them
  // first. Line comments only: a block-comment stripper run over the whole file
  // also eats anything between a "/*" and a "*/" inside a string literal, which
  // would be a hole in a guard of this shape.
  const code = source.replace(/^[ \t]*\/\/.*$/gm, "");
  return [...code.matchAll(/process\.env(?:\.(\w+)|\[([^\]]*)\])/g)].map(
    (m) => m[1] ?? `computed:${m[2]}`
  );
}

describe("the email tab never decides migration from a frontend flag", () => {
  it("guards every component in the login tree", () => {
    // If the directory listing ever comes back empty the assertions below pass
    // for the wrong reason.
    expect(GUARDED).toContain("src/components/login/EmailTab.tsx");
    expect(GUARDED).toContain("src/components/login/LoginContent.tsx");
    expect(GUARDED).toContain("src/components/login/LoginClient.tsx");
    expect(GUARDED.length).toBeGreaterThan(10);
  });

  it.each(GUARDED)("%s reads only the configuration it is allowed to", (relative) => {
    const reads = envReads(readFileSync(path.join(process.cwd(), relative), "utf8"));

    // A computed key (process.env[expr]) is refused outright: it is how a
    // banned name gets past a check that reads source, and there is no reason
    // for one here.
    expect(reads.filter((name) => name.startsWith("computed:"))).toEqual([]);
    expect(reads.filter((name) => !ALLOWED_ENV.includes(name))).toEqual([]);
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
