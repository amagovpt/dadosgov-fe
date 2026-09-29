"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button, Icon, StatusCard } from "@ama-pt/agora-design-system";

import { Typograph } from "../Shared/Generics/Typograph";
import { submitSamlForm } from "./loginUtils";

/**
 * The invitation itself: the words, the three buttons, and the note for
 * somebody who already has two accounts (LEDG-2547).
 *
 * 🚩 IT LIVES APART FROM WHERE IT IS SHOWN, and that is the point. The same
 * invitation appears in two places now -- as a full screen in place of the
 * page, and as a banner above it -- and the surest way to end up with two
 * versions of the same message is to write it twice. LEDG-1628 is the house
 * example: a flow duplicated instead of shared, and only one copy wired up.
 *
 * It reads NOTHING about whether it should be shown. That question belongs to
 * the backend, per account, and is answered by whoever renders this.
 *
 * It lives in src/components/login/ so the migration flag guard keeps reading
 * it, even though the full screen renders far from the login pages.
 */
export function MigrationInviteContent({
  variant,
  onDismiss,
}: {
  /**
   * Which surface is showing it. It changes the words in exactly one place --
   * a full screen has no notice to close -- and nothing else. Everything the
   * citizen has to know is on both.
   */
  variant: "screen" | "banner";
  onDismiss: () => void;
}) {
  const { t } = useTranslation("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Says whether SAML is wired up at all, so whether a button can work. Never
  // whether an ACCOUNT should link -- that is the backend's answer, and it is
  // read by the caller.
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

  return (
    <>
      <div className="flex flex-col gap-8">
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
          {t(variant === "screen" ? "migrationInvite.optionalScreen" : "migrationInvite.optional")}
        </Typograph>
        {/* Said before the click, not discovered after it: the callback issues
            a fresh session cookie, so linking signs the person out until they
            finish. */}
        <Typograph tag="p" className="text-sm text-neutral-700">
          {t("migrationInvite.sessionWarning")}
        </Typograph>
        {/* Said before the click, not after the round-trip. Coming back from
            the IdP to an unexpected password prompt is where people stop. */}
        <Typograph tag="p" className="text-sm text-neutral-700">
          {t("migrationInvite.confirmStep")}
        </Typograph>
        {/* The condition that most invites misreading: linking stamps an
            identity onto an account that has none. Somebody whose CMD already
            belongs to another account is refused at the END of the round-trip,
            and saying it here saves the trip -- and saves them believing it
            worked. */}
        <Typograph tag="p" className="text-sm text-neutral-700">
          {t("migrationInvite.onlyIfFree")}
        </Typograph>
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
        <Button variant="neutral" appearance="outline" onClick={onDismiss}>
          {t("migrationInvite.dismiss")}
        </Button>
      </div>

      {/* The people this is most likely to confuse: it invites them to have one
          account while they already have two, and linking does not merge
          anything. Telling them what they CAN do beats leaving them to hunt for
          a button -- including the part that is not yet possible. */}
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
    </>
  );
}
