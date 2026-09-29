"use client";

import { useState, type ReactNode } from "react";

import { useAuth } from "@/context/AuthContext";
import { dismissMigrationInvite } from "@/service/api/migration";
import { isOnFlowRoute } from "./loginUtils";
import { MigrationInviteSection } from "./MigrationInviteSection";
import { usePathname, useRouter } from "next/navigation";

/**
 * The loud half of the invitation (LEDG-2547): while an account has never
 * dismissed it -- or dismissed it eight days ago or more -- the invite is
 * shown IN PLACE of the page, and the page comes back once it is dismissed.
 *
 * 🚩 IT DOES NOT NAVIGATE, and that is a decision rather than an omission. A
 * redirect to a page of its own was the obvious shape and it carries five ways
 * to trap somebody:
 *
 *   - the gate firing again on the page it just sent them to;
 *   - a failed dismissal leaving the backend's answer true, so the redirect
 *     repeats for ever;
 *   - the browser's back button landing on a page the gate bounces again;
 *   - sessionStorage, which the first three would be fixed with, not being
 *     available at all;
 *   - and the one that is not even a bug: somebody who followed a link to a
 *     dataset is thrown somewhere else and LOSES the link.
 *
 * Rendering in place has none of them. There is no navigation to loop, no
 * history to walk back into, nothing to remember between pages, and the URL is
 * still the one they asked for -- so dismissing leaves them exactly where they
 * were going.
 *
 * ⚠️ The opposite of CompleteRegistrationGate, which redirects and is MEANT to
 * trap: an account with a placeholder address may not browse. This one must
 * always let go.
 */
export function MigrationInviteGate({ children }: { children: ReactNode }) {
  const { migrationInvite, isLoading, refresh } = useAuth();
  const routerNav = useRouter();
  const pathname = usePathname();

  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = async (goTo?: string) => {
    // Released first, confirmed after. A screen that holds the portal hostage
    // while a request completes reads as a broken button -- and if the write
    // fails there is nothing the citizen can do about it, so making them wait
    // buys nothing. The worst case is that the screen returns on the next
    // visit, which is what it would have done anyway.
    setDismissed(true);
    try {
      await dismissMigrationInvite();
      await refresh();
    } catch {
      // Deliberately silent: nothing was lost, and nothing they can act on.
    } finally {
      if (goTo) routerNav.push(goTo);
    }
  };

  // isLoading is in the condition for hydration, not for looks: /me is fetched
  // in the browser, so the server renders the page and a client that answered
  // before React hydrated would swap it for the invite in HTML that never had
  // it. Waiting makes both passes agree on the page.
  // isOnFlowRoute is the sixth trap, and it cost somebody the whole flow
  // (LEDG-2571): rendering in place avoids the five a redirect brings, but a
  // screen that covers every page also covers /migrate-account -- the page
  // that CONCLUDES the linking its own button just started. The invite stays
  // true throughout that round trip, because the linking is not finished, so
  // whoever came back from the identity provider landed on this screen again
  // and could never reach the confirmation step.
  //
  // The banner had been standing down on these pages since the start. The
  // gate, which covers far more, never was.
  if (isLoading || !migrationInvite || dismissed || isOnFlowRoute(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="container mx-auto pt-64 pb-96">
      <div className="max-w-[696px]">
        <MigrationInviteSection onDismiss={handleDismiss} />
      </div>
    </div>
  );
}
