"use client";

import { useState, type ReactNode } from "react";

import { useAuth } from "@/context/AuthContext";
import { dismissMigrationInvite } from "@/service/api/migration";
import { MigrationInviteContent } from "./MigrationInviteContent";

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
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = async () => {
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
    }
  };

  // isLoading is in the condition for hydration, not for looks: /me is fetched
  // in the browser, so the server renders the page and a client that answered
  // before React hydrated would swap it for the invite in HTML that never had
  // it. Waiting makes both passes agree on the page.
  if (isLoading || !migrationInvite || dismissed) return <>{children}</>;

  return (
    <div className="container mx-auto my-32 flex max-w-4xl flex-col gap-16 rounded-8 border border-informative-300 bg-informative-50 p-24">
      <MigrationInviteContent variant="screen" onDismiss={handleDismiss} />
    </div>
  );
}
