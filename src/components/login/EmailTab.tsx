"use client";

import { useTranslation } from "react-i18next";
import { Icon } from "@ama-pt/agora-design-system";
import { MigrationNotice } from "./MigrationNotice";
import { Typograph } from "../Shared/Generics/Typograph";

export function EmailTab({
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
    <div className="rounded-8">
      <div className="flex flex-col gap-40">
        <div className="flex items-center justify-between gap-32">
          <div className="flex flex-col gap-8">
            <Typograph tag="h2" className="text-base font-bold text-brand-blue-dark">
              {t("beforeStart.title")}
            </Typograph>
            <Typograph tag="p" className="text-neutral-900">
              {t("email.beforeStartDescription")}
            </Typograph>
          </div>
          <div className="icon-white shrink-0 rounded-8 bg-primary-600 p-16">
            <Icon name="agora-solid-social-security" className="h-24 w-24" />
          </div>
        </div>
        <div className="my-32 h-2 w-full bg-neutral-400" />
        <div className="flex flex-col gap-32">
          <MigrationNotice
            samlEnabled={samlEnabled}
            isLoading={isLoading}
            error={error}
            onSaml={onSaml}
            onEidas={onEidas}
          />
        </div>
      </div>
    </div>
  );
}
