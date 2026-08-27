import { PHASE_PRODUCTION_BUILD } from "next/constants";

import { getFooter } from "./footer";
import { getHeaderNavigation } from "./header";
import type { HeaderNavigationData } from "@/service/types/header";
import type { Footer } from "@/service/types/header/footer";

/**
 * Thrown when the portal's shell cannot be built at all: both CMS singletons
 * that feed the header and the footer failed, so the visitor would get a page
 * framed by an empty header and an empty footer — a broken shell pretending to
 * be up. Letting it out of the root layout hands the request to
 * `app/global-error.tsx` instead.
 */
export class ShellUnavailableError extends Error {
  constructor(options?: { cause?: unknown }) {
    super("header and footer both unavailable — the CMS is unreachable", options);
    this.name = "ShellUnavailableError";
  }
}

export interface ShellData {
  headerNavigation: HeaderNavigationData;
  footerData: Footer;
}

/**
 * Load the navigation and the footer for the root layout, and decide whether
 * what came back is still a portal.
 *
 * Both queries hit the same Squidex endpoint, which is what makes the rule
 * work: **one** of them failing is a content or schema problem and the empty
 * fallback is the right answer — the rest of the page still renders. **Both**
 * failing means the CMS is not there, no page can open, and the request
 * belongs to the global error boundary.
 *
 * The stale-while-revalidate cache in `apollo-client.ts` keeps this rare: a
 * warm process serves a stale shell straight through a CMS outage. Only a cold
 * process against a dead CMS reaches the throw.
 */
export async function loadShellData(locale: string): Promise<ShellData> {
  const [header, footer] = await Promise.allSettled([
    getHeaderNavigation(locale),
    getFooter(locale),
  ]);

  if (header.status === "rejected") {
    console.error("Error fetching header navigation:", header.reason);
  }
  if (footer.status === "rejected") {
    console.error("Error fetching footer data:", footer.reason);
  }

  if (header.status === "rejected" && footer.status === "rejected") {
    // A build must not depend on the CMS being up: today it degrades to an
    // empty shell and completes, and that cannot regress into a failed deploy.
    if (process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD) {
      throw new ShellUnavailableError({ cause: header.reason });
    }
  }

  return {
    headerNavigation:
      header.status === "fulfilled" ? header.value : ({} as HeaderNavigationData),
    footerData: footer.status === "fulfilled" ? footer.value : ({} as Footer),
  };
}
