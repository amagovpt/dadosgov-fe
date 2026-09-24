"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Icon } from "@ama-pt/agora-design-system";

import { useAuth } from "@/context/AuthContext";
import { dismissMigrationInvite } from "@/service/api/migration";
import { MigrationInviteContent } from "./MigrationInviteContent";

/**
 * The optional invitation to link a CMD/eIDAS identity to an account that
 * signs in with a password (LEDG-2517).
 *
 * 🚨 WHETHER IT SHOWS IS THE BACKEND'S ANSWER, per account, read from /me
 * through AuthContext. Nothing here reads configuration, and nothing here
 * re-derives the condition: that is the regression LEDG-2432 was, where the
 * frontend assumed a migration flag and removed the sign-in form from
 * production. The guard that keeps it that way reads this file's source
 * (migration-flag-guard.test.ts), because nothing observable in a rendered
 * page distinguishes "the backend told us" from "we guessed".
 *
 * It lives in src/components/login/ for that reason and not by accident --
 * that directory is what the guard reads.
 *
 * Optional in the strong sense: dismissing costs nothing, does not sign
 * anybody out, and is not a refusal. The backend stores a DATE, so the invite
 * returns after a month, and the way back stays open to somebody who
 * dismissed it and changed their mind.
 */
/**
 * Every page about signing in, and none of them is a place to be invited to
 * link an account.
 *
 * 🚩 Two different ways it reads wrong, and both were seen on screen:
 *
 *  - on the flow's own pages (migrate-account, complete-registration) it
 *    invites somebody to start what they are in the middle of, which reads as
 *    "the first step did not work" -- and its buttons restart the flow from
 *    scratch, throwing away what they have already done;
 *  - on /login after a refusal it contradicts the refusal outright: "Associe a
 *    sua conta" directly above "Não foi possível associar", with buttons that
 *    would repeat the same doomed round-trip. The notice appears there at all
 *    because the remember-me cookie keeps /me answering after the refusal
 *    logged the session out.
 *
 * Matched by path segment so neither a locale prefix nor a sub-route slips
 * past.
 */
const FLOW_ROUTES = [
  "migrate-account",
  "complete-registration",
  "login",
  "loginregister",
  "register",
  "reset-password",
];

export function MigrationInvite() {
  const { t } = useTranslation("login");
  const { migrationInvite, isLoading: authLoading, refresh } = useAuth();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  // isLoading is in the condition for hydration, not for looks: /me is fetched
  // in the browser, so the server renders nothing and a client that answered
  // before React hydrated would render the notice into HTML that never had it.
  const onFlowPage = (pathname ?? "").split("/").some((segment) => FLOW_ROUTES.includes(segment));

  const handleDismiss = async () => {
    // Hidden immediately, and the write is confirmed afterwards. A notice that
    // stays on screen while a request completes reads as a broken button, and
    // the worst case of a failed write is that it comes back on the next load
    // -- which is what it would have done anyway.
    setDismissed(true);
    try {
      await dismissMigrationInvite();
      await refresh();
    } catch {
      // Deliberately silent: there is nothing the person can do about it, and
      // nothing was lost.
    }
  };

  if (authLoading || onFlowPage || !migrationInvite || dismissed) return null;

  return (
    <div
      role="status"
      className="container mx-auto mt-16 flex max-w-7xl flex-col gap-16 rounded-8 border border-informative-300 bg-informative-50 p-16"
    >
      <div className="flex items-start gap-16">
        <Icon
          name="agora-line-info-mark"
          className="h-24 w-24 shrink-0 text-informative-600"
          aria-hidden
        />
        <div className="flex flex-grow flex-col gap-16">
          <MigrationInviteContent variant="banner" onDismiss={handleDismiss} />
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label={t("migrationInvite.close")}
          className="shrink-0 text-neutral-700"
        >
          <Icon name="agora-line-close" className="h-24 w-24" aria-hidden />
        </button>
      </div>
    </div>
  );
}
