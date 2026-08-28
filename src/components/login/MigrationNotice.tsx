"use client";

import { Button, Icon, StatusCard } from "@ama-pt/agora-design-system";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { PRIMARY_BUTTON_CLASS } from "./constants";
import { Typograph } from "../Shared/Generics/Typograph";

const CMD_ACTIVATION_URL = "https://www.autenticacao.gov.pt/cmd-pedido-chave";
const EIDAS_INFO_URL = "https://www.autenticacao.gov.pt/eidas";

/**
 * The "E-mail e palavra-passe" tab: the entry point for linking a legacy
 * account to a CMD or eIDAS identity.
 *
 * Both buttons start a SAML login, so they carry the same samlEnabled gate the
 * CMD and eIDAS tabs use, and they render the SAML error themselves — they are
 * the only controls on this tab now, and the form that used to display it is
 * gone.
 */
export function MigrationNotice({
  samlEnabled,
  isLoading,
  error,
  onSaml,
  onEidas,
}: {
  samlEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  onSaml: () => void;
  onEidas: () => void;
}) {
  const { t } = useTranslation("login");

  return (
    <>
      <div>
        <Typograph tag="h2" className="mb-8 text-xl-bold text-brand-blue-dark">
          {t("migration.title")}
        </Typograph>
        <Typograph tag="p" className="text-neutral-900">
          {t("migration.description")}
        </Typograph>
      </div>

      {error && <StatusCard variant="danger" showIcon description={error} />}

      <div className="flex flex-col gap-32">
        <div className="flex flex-col items-start gap-8">
          <Button
            variant="primary"
            className={PRIMARY_BUTTON_CLASS}
            disabled={!samlEnabled || isLoading}
            onClick={onSaml}
          >
            {t("migration.migrateCmd")}
          </Button>
          <Typograph tag="p" className="text-sm text-neutral-700">
            {t("migration.noCmdPrompt")}{" "}
            <a
              href={CMD_ACTIVATION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline"
            >
              {t("migration.noCmdLink")}
            </a>
          </Typograph>
        </div>

        <div className="flex flex-col items-start gap-8">
          <Button
            variant="neutral"
            className={PRIMARY_BUTTON_CLASS}
            disabled={!samlEnabled || isLoading}
            onClick={onEidas}
          >
            {t("migration.migrateEidas")}
          </Button>
          <Typograph tag="p" className="text-sm text-neutral-700">
            <a
              href={EIDAS_INFO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline"
            >
              {t("migration.eidasLearnMore")}
            </a>
          </Typograph>
        </div>
      </div>

      <StatusCard
        variant="informative"
        showIcon
        description={
          <div className="flex flex-col gap-8">
            <Typograph tag="p" className="text-sm font-bold">
              {t("migration.entityTitle")}
            </Typograph>
            <Typograph tag="p" className="text-sm">
              {t("migration.entityDescription")}
            </Typograph>
            <Link
              href="/ajuda-e-contactos"
              className="text-sm flex items-center gap-8 text-informative-600"
            >
              {t("migration.entityLink")}
              <Icon
                name="agora-line-arrow-right-circle"
                className="h-16 w-16 text-informative-600"
              />
            </Link>
          </div>
        }
      />
    </>
  );
}
