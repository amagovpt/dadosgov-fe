"use client";

import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Button, StatusCard } from "@ama-pt/agora-design-system";

import { Typograph } from "../Shared/Generics/Typograph";
import { submitSamlForm } from "./loginUtils";

export type MigrationInviteSectionI = {
  onDismiss: (goTo?: string) => void;
};

export function MigrationInviteSection({ onDismiss }: MigrationInviteSectionI) {
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
    <div className="flex flex-col gap-64">
      <div className="flex flex-col gap-16">
        <Typograph tag="h1" className="text-2xl-bold text-primary-900">
          {t("MigrationInviteSection.title")}
        </Typograph>
        <Typograph
          tag="p"
          className="max-w-[592px] text-m-regular whitespace-pre-line text-primary-900"
        >
          <Trans t={t} i18nKey="MigrationInviteSection.description" components={{ b: <b /> }} />
        </Typograph>
      </div>

      {error && <StatusCard variant="danger" showIcon description={error} />}

      <div className="flex flex-col gap-32">
        <div className="flex flex-wrap gap-16">
          <Button
            variant="primary"
            hasIcon
            trailingIcon="agora-line-external-link"
            trailingIconHover="agora-line-external-link"
            disabled={!samlEnabled || isLoading}
            onClick={() => startLink("/saml/link/start")}
          >
            {t("MigrationInviteSection.linkCmd")}
          </Button>
          <Button
            variant="primary"
            hasIcon
            trailingIcon="agora-line-external-link"
            trailingIconHover="agora-line-external-link"
            disabled={!samlEnabled || isLoading}
            onClick={() => startLink("/saml/eidas/link/start")}
          >
            {t("MigrationInviteSection.linkEidas")}
          </Button>
        </div>

        <div>
          <Button
            variant="primary"
            appearance="link"
            onClick={() => onDismiss()}
            hasIcon
            trailingIcon="agora-line-arrow-right-circle"
            trailingIconHover="agora-line-arrow-right-circle"
          >
            {t("MigrationInviteSection.skip")}
          </Button>
        </div>

        <StatusCard
          variant="informative"
          showIcon
          description={
            <div className="flex flex-col gap-8">
              <Typograph tag="p" className="text-sm font-bold">
                {t("MigrationInviteSection.otherAccount.title")}
              </Typograph>
              <Typograph tag="p" className="text-sm">
                {t("MigrationInviteSection.otherAccount.description")}
              </Typograph>
              <div>
                <Button
                  variant="neutral"
                  appearance="link"
                  hasIcon
                  trailingIcon="agora-line-arrow-right-circle"
                  trailingIconHover="agora-line-arrow-right-circle"
                  className="px-0"
                  onClick={() => onDismiss("/ajuda-e-contactos")}
                >
                  {t("MigrationInviteSection.otherAccount.help")}
                </Button>
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
}
