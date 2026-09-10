"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Checkbox,
  InputPassword,
  InputText,
  StatusCard,
} from "@ama-pt/agora-design-system";
import { PRIMARY_BUTTON_CLASS, TEXT_LINK_BUTTON_CLASS } from "./constants";
import { TermsSection } from "./LoginShared";
import { Typograph } from "../Shared/Generics/Typograph";

export function EmailLoginForm({
  prefilledEmail,
  isLoading,
  error,
  onSubmit,
  onForgotPassword,
}: {
  prefilledEmail: string;
  isLoading: boolean;
  error: string | null;
  onSubmit: (email: string, password: string) => void;
  onForgotPassword: () => void;
}) {
  const { t } = useTranslation("login");
  const [loginEmail, setLoginEmail] = useState(prefilledEmail);
  const [loginPassword, setLoginPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // The disabled submit button is not the gate it looks like: implicit
    // submission does not consult it, so pressing Enter in a field used to send
    // the credentials with the terms unaccepted. The terms are the consent for
    // processing personal data, so the check belongs here, where every path
    // through the form passes.
    if (!loginEmail || !loginPassword || !termsAccepted) return;
    onSubmit(loginEmail, loginPassword);
  };

  return (
    <>
      <div>
        <Typograph tag="p" className="text-neutral-900">
          {t("email.requiredFieldsNote")}
        </Typograph>
      </div>

      {error && <StatusCard variant="danger" showIcon description={error} />}

      <form
        className="flex flex-col gap-24"
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          // Only from a text field. This used to fire on any Enter that reached
          // the form, which cancelled the default action of everything inside
          // it: focusing "Recuperar palavra-passe" and pressing Enter submitted
          // the form instead of opening recovery, and the terms link could not
          // be followed by keyboard at all. Enter in an <input> already submits
          // natively, so the handler is only here to keep that working while
          // the rest of the form stops being hijacked.
          if (e.key !== "Enter") return;
          if (!(e.target instanceof HTMLInputElement)) return;
          if (e.target.type === "checkbox") return;
          e.preventDefault();
          e.currentTarget.requestSubmit();
        }}
      >
        <InputText
          label={t("email.emailLabel")}
          placeholder={t("email.emailPlaceholder")}
          id="login-email"
          name="email"
          type="email"
          className="w-full max-w-[560px]"
          disabled={isLoading}
          value={loginEmail}
          onChange={(e) => setLoginEmail(e.target.value)}
        />

        <div className="flex max-w-[560px] flex-col gap-8">
          <InputPassword
            label={t("email.passwordLabel")}
            placeholder={t("email.passwordPlaceholder")}
            id="login-password"
            name="password"
            className="w-full"
            disabled={isLoading}
            onChange={(e) => setLoginPassword(e.target.value)}
          />
        </div>

        <div className="flex items-center text-neutral-900">
          <Checkbox label={t("email.rememberPassword")} id="remember-me" name="remember-me" />
        </div>

        <div className="mt-24 flex items-center gap-8">
          <Typograph tag="span" className="text-sm text-neutral-900">
            {t("email.forgotPassword")}
          </Typograph>
          <button type="button" className={TEXT_LINK_BUTTON_CLASS} onClick={onForgotPassword}>
            {t("email.recoverPassword")}
          </button>
        </div>

        <TermsSection
          id="terms-email"
          checked={termsAccepted}
          onChange={setTermsAccepted}
        />

        <div className="mt-8">
          <Button
            variant="primary"
            type="submit"
            className={PRIMARY_BUTTON_CLASS}
            disabled={isLoading || !loginEmail || !loginPassword || !termsAccepted}
          >
            {isLoading ? t("email.submitLoading") : t("email.submit")}
          </Button>
        </div>
      </form>
    </>
  );
}
