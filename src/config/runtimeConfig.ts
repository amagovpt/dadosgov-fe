import "server-only";
import { connection } from "next/server";
import type { RuntimeConfig } from "@/providers/RuntimeConfigProvider";

/**
 * Reads an environment variable from the running process.
 *
 * `next build` replaces `NEXT_PUBLIC_*` reads with the value present at build
 * time, in the server bundle too — and Turbopack does it for `env["NAME"]` as
 * well, not only for `process.env.NAME` (checked on Next 16.3: a build-time
 * value ended up constant-folded into the output). A name passed in as a
 * parameter is the one form the compiler cannot resolve, so it stays a runtime
 * read. Do not inline the calls below back into `process.env.NEXT_PUBLIC_…`.
 */
function runtimeEnv(name: string): string | undefined {
  return process.env[name];
}

/**
 * Per-environment settings the browser needs, read from the container
 * environment on each request, so one image serves every environment. They
 * keep their historical `NEXT_PUBLIC_` names, but reach client components only
 * through `RuntimeConfigProvider`. `connection()` keeps this out of any
 * build-time prerender.
 */
export async function getRuntimeConfig(): Promise<RuntimeConfig> {
  await connection();
  return {
    samlEnabled: runtimeEnv("NEXT_PUBLIC_SAML_ENABLED") === "true",
    recaptchaSiteKey: runtimeEnv("NEXT_PUBLIC_RECAPTCHA_SITE_KEY") || "",
  };
}

export interface AnalyticsConfig {
  cmpSettingsId: string;
  cmpDraft: boolean;
  gaId: string;
}

export async function getAnalyticsConfig(): Promise<AnalyticsConfig> {
  await connection();
  return {
    cmpSettingsId:
      runtimeEnv("NEXT_PUBLIC_KARMA_ID") || process.env.NEXT_PUBLIC_KARMA_ID || "",
    cmpDraft: runtimeEnv("NEXT_PUBLIC_UC_DRAFT") === "true",
    gaId: runtimeEnv("NEXT_PUBLIC_GA_ID") || process.env.NEXT_PUBLIC_GA_ID || "",
  };
}
