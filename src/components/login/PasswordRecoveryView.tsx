"use client";

import React, { useState } from "react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { useTranslation } from "react-i18next";
import { Button, InputText, StatusCard } from "@ama-pt/agora-design-system";
import { PRIMARY_BUTTON_CLASS, TEXT_LINK_BUTTON_CLASS } from "./constants";
import { Typograph } from "../Shared/Generics/Typograph";

export function PasswordRecoveryView({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation("login");
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let recaptchaToken: string | null = null;
    if (executeRecaptcha) {
      try {
        recaptchaToken = await executeRecaptcha("password_reset");
      } catch (err) {
        console.warn("reCAPTCHA execution failed:", err);
      }
    }

    try {
      const res = await fetch("/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, recaptcha_token: recaptchaToken }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.message || t("recovery.errorRequest"));
      }
    } catch {
      setError(t("recovery.errorConnection"));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setEmail("");
    setError(null);
    setSuccess(false);
    onBack();
  };

  if (success) {
    return (
      <>
        <StatusCard
          variant="success"
          showIcon
          description={t("recovery.success")}
        />
        <div className="mt-16">
          <button type="button" className={TEXT_LINK_BUTTON_CLASS} onClick={handleBack}>
            {t("recovery.back")}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div>
        <Typograph tag="h2" className="mb-8 text-xl-bold text-brand-blue-dark">
          {t("recovery.title")}
        </Typograph>
        <Typograph tag="p" className="text-neutral-900">
          {t("recovery.description")}
        </Typograph>
      </div>

      {error && <StatusCard variant="danger" showIcon description={error} />}

      <form className="flex flex-col gap-24" onSubmit={handleSubmit}>
        <InputText
          label={t("recovery.emailLabel")}
          placeholder={t("recovery.emailPlaceholder")}
          id="recovery-email"
          name="email"
          type="email"
          className="w-full max-w-[560px]"
          disabled={loading}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="mt-8 flex items-center gap-16">
          <Button
            variant="primary"
            type="submit"
            className={PRIMARY_BUTTON_CLASS}
            disabled={loading || !email}
          >
            {loading ? t("recovery.submitLoading") : t("recovery.submit")}
          </Button>
          <button type="button" className={TEXT_LINK_BUTTON_CLASS} onClick={handleBack}>
            {t("recovery.back")}
          </button>
        </div>
      </form>
    </>
  );
}
