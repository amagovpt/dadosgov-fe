"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button, Icon, StatusCard } from "@ama-pt/agora-design-system";

import { useAuth } from "@/context/AuthContext";
import { dismissMigrationInvite } from "@/service/api/migration";
import { Typograph } from "../Shared/Generics/Typograph";
import { MigrationInviteContent } from "./MigrationInviteContent";
import { submitSamlForm } from "./loginUtils";

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
  const { migrationInvite, migrationLinkAvailable, isLoading: authLoading, refresh } = useAuth();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // isLoading is in the condition for hydration, not for looks: /me is fetched
  // in the browser, so the server renders nothing and a client that answered
  // before React hydrated would render the notice into HTML that never had it.
  const onFlowPage = (pathname ?? "").split("/").some((segment) => FLOW_ROUTES.includes(segment));

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Says whether SAML is wired up at all, so whether a button can work. Never
  // whether an ACCOUNT should link -- that is the backend's answer above.
  const samlEnabled = process.env.NEXT_PUBLIC_SAML_ENABLED === "true";

  const startLink = async (endpoint: string) => {
    setIsLoading(true);
    setError(null);
    const samlError = await submitSamlForm(endpoint, t);
    if (samlError) {
      setError(samlError);
      setIsLoading(false);
    }
    // No else: on success the page is already navigating away to the IdP.
  };

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

  // 🚩 The three states are disjoint, and this is the line that makes them so.
  // `migrationInvite` is the LOUD state -- never dismissed, or dismissed eight
  // days ago or more -- and MigrationInviteGate owns it, showing the invite in
  // place of the page. The banner is the quiet state in between: the account
  // can still link, and has dismissed recently.
  //
  // Reading `migrationInvite` here, as this did before the full screen existed,
  // would put both on screen at once.
  const inQuietState = migrationLinkAvailable && !migrationInvite;

  if (authLoading || onFlowPage || !inQuietState || dismissed) return null;

  return (
    <div
      role="status"
      className="container mx-auto mt-16 flex max-w-7xl flex-col gap-16 rounded-8 border border-informative-300 bg-informative-50 p-16"
    >
      {error && <StatusCard variant="danger" showIcon description={error} />}

      <div className="flex items-start gap-16">
        <Icon
          name="agora-line-info-mark"
          className="h-24 w-24 shrink-0 text-informative-600"
          aria-hidden
        />
        <div className="flex flex-grow flex-col gap-16">
          {/* Short by default. The full screen carries the whole invitation
              every eight days; repeating all six sentences on every page in
              between is how a notice stops being read. */}
          {expanded ? (
            <MigrationInviteContent variant="banner" onDismiss={handleDismiss} />
          ) : (
            <>
              <Typograph tag="p" className="text-sm text-neutral-900">
                {t("migrationInvite.bannerSummary")}
              </Typograph>
              <div className="flex flex-wrap items-center gap-8">
                <Button
                  variant="primary"
                  disabled={!samlEnabled || isLoading}
                  onClick={() => startLink("/saml/link/start")}
                >
                  {t("migrationInvite.linkCmd")}
                </Button>
                <Button
                  variant="neutral"
                  disabled={!samlEnabled || isLoading}
                  onClick={() => startLink("/saml/eidas/link/start")}
                >
                  {t("migrationInvite.linkEidas")}
                </Button>
                <Button variant="neutral" appearance="outline" onClick={handleDismiss}>
                  {t("migrationInvite.dismiss")}
                </Button>
              </div>
            </>
          )}
          {/* 🚩 The way to the rest, and it opens IN PLACE. There is no page to
              link to: LEDG-2547 renders the full invitation instead of the
              page rather than navigating, precisely so nobody loses where they
              were going. The same reasoning applies here.

              What must survive the shortening is the condition that linking
              only works on an identity no other account holds -- without it
              somebody travels to the IdP to be refused at the end. */}
          <Button
            variant="primary"
            appearance="link"
            className="h-auto self-start p-0 text-sm"
            onClick={() => setExpanded((open) => !open)}
          >
            {t(expanded ? "migrationInvite.bannerLess" : "migrationInvite.bannerMore")}
          </Button>
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
