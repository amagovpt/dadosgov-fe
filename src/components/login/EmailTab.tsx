"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@ama-pt/agora-design-system";
import { EmailLoginForm } from "./EmailLoginForm";
import { MigrationNotice } from "./MigrationNotice";
import { PasswordRecoveryView } from "./PasswordRecoveryView";
import { Typograph } from "../Shared/Generics/Typograph";

/**
 * The "email and password" tab: sign-in form by default, migration notice when
 * the backend says this account has to migrate first.
 *
 * `migrationRequired` is per-login-attempt state, fed by the `migration_required`
 * answer the backend returns from /auth/login — never a migration flag read here.
 * The tab offers the form and lets the backend decide, so it behaves correctly
 * whichever value MIGRATION_MODE_ENABLED holds. Deciding it here instead is what
 * removed the form in the first place (LEDG-2432).
 *
 * `samlEnabled` is a different thing and does belong to the frontend: it gates the
 * two account-linking buttons inside MigrationNotice, which are dead controls when
 * SAML is off.
 */
export function EmailTab({
  samlEnabled,
  prefilledEmail,
  isLoading,
  error,
  migrationRequired,
  onLogin,
  onSaml,
  onEidas,
}: {
  samlEnabled: boolean;
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
        <div className="my-32 h-2 w-full bg-neutral-400" />
        <div className="flex flex-col gap-32">
          {migrationRequired ? (
            <MigrationNotice
              samlEnabled={samlEnabled}
              isLoading={isLoading}
              error={error}
              onSaml={onSaml}
              onEidas={onEidas}
            />
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
