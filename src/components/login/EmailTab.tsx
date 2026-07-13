"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@ama-pt/agora-design-system";
import { EmailLoginForm } from "./EmailLoginForm";
import { MigrationNotice } from "./MigrationNotice";
import { PasswordRecoveryView } from "./PasswordRecoveryView";
import { Typograph } from "../Shared/Generics/Typograph";

export function EmailTab({
  prefilledEmail,
  isLoading,
  error,
  migrationRequired,
  onLogin,
  onSaml,
  onEidas,
}: {
  prefilledEmail: string;
  isLoading: boolean;
  error: string | null;
  migrationRequired: boolean;
  onLogin: (email: string, password: string) => void;
  onSaml: () => void;
  onEidas: () => void;
}) {
  const { t } = useTranslation("login");
  const [showRecovery, setShowRecovery] = useState(false);

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
        <div className="my-32 h-[2px] w-full bg-neutral-400" />
        <div className="flex flex-col gap-32">
          {migrationRequired ? (
            <MigrationNotice onSaml={onSaml} onEidas={onEidas} />
          ) : showRecovery ? (
            <PasswordRecoveryView onBack={() => setShowRecovery(false)} />
          ) : (
            <EmailLoginForm
              prefilledEmail={prefilledEmail}
              isLoading={isLoading}
              error={error}
              onSubmit={onLogin}
              onForgotPassword={() => setShowRecovery(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
