"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button, Icon, StatusCard } from "@ama-pt/agora-design-system";

import { useAuth } from "@/context/AuthContext";
import { dismissMigrationInvite } from "@/service/api/migration";
import { Typograph } from "../Shared/Generics/Typograph";
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
export function MigrationInvite() {
  const { t } = useTranslation("login");
  const { migrationInvite, refresh } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Shares the samlEnabled gate with every other control that starts a SAML
  // round-trip: without it these buttons fire a request that cannot succeed.
  // It says whether SAML is wired up at all, never whether an ACCOUNT should
  // link -- that question belongs to the backend, per account, and is the
  // `migrationInvite` above.
  const samlEnabled = process.env.NEXT_PUBLIC_SAML_ENABLED === "true";

  if (!migrationInvite || dismissed) return null;

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

  return (
    <div
      role="status"
      className="container mx-auto mt-16 flex max-w-7xl flex-col gap-16 rounded-8 border border-informative-300 bg-informative-50 p-16"
    >
      <div className="flex items-start gap-16">
        <Icon
          name="agora-line-information-circle"
          className="h-24 w-24 shrink-0 text-informative-600"
          aria-hidden
        />
        <div className="flex flex-grow flex-col gap-8">
          <Typograph tag="h2" className="text-base-bold text-neutral-900">
            {t("migrationInvite.title")}
          </Typograph>
          <Typograph tag="p" className="text-sm-bold text-neutral-900">
            {t("migrationInvite.oneAccount")}
          </Typograph>
          <Typograph tag="p" className="text-sm text-neutral-700">
            {t("migrationInvite.result")}
          </Typograph>
          <Typograph tag="p" className="text-sm text-neutral-700">
            {t("migrationInvite.optional")}
          </Typograph>
          {/* Said before the click, not discovered after it: the ACS issues a
              fresh session cookie, so linking signs the person out until they
              finish. */}
          <Typograph tag="p" className="text-sm text-neutral-700">
            {t("migrationInvite.sessionWarning")}
          </Typograph>
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

      {error && <StatusCard variant="danger" showIcon description={error} />}

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

      {/* The people this notice is most likely to confuse: it invites them to
          have one account while they already have two, and linking does not
          merge anything. Telling them what they CAN do beats leaving them to
          hunt for a button -- including the part that is not yet possible. */}
      <StatusCard
        variant="informative"
        showIcon
        description={
          <div className="flex flex-col gap-8">
            <Typograph tag="p" className="text-sm font-bold">
              {t("migrationInvite.alreadyTwoTitle")}
            </Typograph>
            <Typograph tag="p" className="text-sm">
              {t("migrationInvite.alreadyTwoDescription")}
            </Typograph>
            <Typograph tag="p" className="text-sm">
              {t("migrationInvite.alreadyTwoLimitation")}
            </Typograph>
            <Link
              href="/ajuda-e-contactos"
              className="flex items-center gap-8 text-sm text-informative-600"
            >
              {t("migrationInvite.alreadyTwoLink")}
              <Icon
                name="agora-line-arrow-right-circle"
                className="h-16 w-16 text-informative-600"
                aria-hidden
              />
            </Link>
          </div>
        }
      />
    </div>
  );
}
