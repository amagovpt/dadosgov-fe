"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, StatusCard } from "@ama-pt/agora-design-system";

import { useAuth } from "@/context/AuthContext";
import { Typograph } from "../Shared/Generics/Typograph";
import { submitSamlForm } from "./loginUtils";

/**
 * The permanent way into the CMD/eIDAS linking flow, shown in the profile
 * beside the email and the password — which is where somebody looks for it.
 *
 * 🚩 IT READS migrationLinkAvailable AND NOT migrationInvite, and that is the
 * entire reason it exists as its own component. `migrationInvite` goes false
 * the moment the notice is dismissed, which is what it is for; an entry point
 * built on it would vanish with the notice, so "Not now" would have closed the
 * door behind itself and changing your mind would mean waiting out the window.
 *
 * It lives in src/components/login/ although it renders in the profile: that
 * directory is what the migration flag guard reads, and everything that acts
 * on a migration decision belongs inside it.
 */
export function MigrationLinkSection() {
  const { t } = useTranslation("login");
  const { migrationLinkAvailable, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Says whether SAML is wired up at all, so whether a button can work. Never
  // whether an ACCOUNT should link — that is the backend's answer above.
  const samlEnabled = process.env.NEXT_PUBLIC_SAML_ENABLED === "true";

  // Same reason as its sibling: /me is fetched in the browser, so rendering
  // before the answer arrives makes the server and the client disagree.
  if (authLoading || !migrationLinkAvailable) return null;

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
    <div className="mt-16 flex flex-col gap-8">
      <Typograph tag="h3" className="text-base-bold text-neutral-900">
        {t("migrationInvite.sectionTitle")}
      </Typograph>
      <Typograph tag="p" className="text-sm text-neutral-700">
        {t("migrationInvite.result")}
      </Typograph>
      {/* Said here too, and not only in the notice: somebody reaching this from
          the profile never saw the notice, or dismissed it days ago. */}
      <Typograph tag="p" className="text-sm text-neutral-700">
        {t("migrationInvite.sessionWarning")}
      </Typograph>
      <Typograph tag="p" className="text-sm text-neutral-700">
        {t("migrationInvite.confirmStep")}
      </Typograph>
      <Typograph tag="p" className="text-sm text-neutral-700">
        {t("migrationInvite.onlyIfFree")}
      </Typograph>

      {error && <StatusCard variant="danger" showIcon description={error} />}

      <div className="flex flex-wrap items-center gap-8">
        <Button
          appearance="outline"
          variant="neutral"
          disabled={!samlEnabled || isLoading}
          onClick={() => startLink("/saml/link/start")}
        >
          {t("migrationInvite.linkCmd")}
        </Button>
        <Button
          appearance="outline"
          variant="neutral"
          disabled={!samlEnabled || isLoading}
          onClick={() => startLink("/saml/eidas/link/start")}
        >
          {t("migrationInvite.linkEidas")}
        </Button>
      </div>
    </div>
  );
}
