"use client";

import React, { useState } from "react";
import {
  Button,
  InputPassword,
  StatusCard,
  Icon,
} from "@ama-pt/agora-design-system";
import BreadcrumbDynamic from "@/components/Shared/BreadcrumbDynamic";
import { useLocalizedHref } from "@/hooks/useLocalizedHref";
import { useTranslation } from "react-i18next";

interface Props {
  token: string;
}

export function ResetPasswordClient({ token }: Props) {
  const { t } = useTranslation("login");
  const localizeHref = useLocalizedHref();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordsMatch = password && passwordConfirm && password === passwordConfirm;
  const canSubmit = passwordsMatch && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordsMatch) {
      setError(t("resetPassword.mismatch"));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, password_confirm: passwordConfirm }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.message || t("resetPassword.errorRequest"));
      }
    } catch {
      setError(t("resetPassword.errorConnection"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-grow bg-white min-h-screen relative">
      <div className="container mx-auto px-16 pt-32 pb-64 max-w-7xl">
        <div className="mb-32">
          {/* The reset token is a credential: keep it out of the trail. */}
          <BreadcrumbDynamic darkMode={false} path="/reset-password" />
        </div>

        <div className="grid xl:grid-cols-12 gap-32">
          <div className="xl:col-span-3" />
          <div className="xl:col-span-6 xl:col-start-4">
            {success ? (
              <div className="flex flex-col gap-32">
                <div className="flex items-center justify-center w-64 h-64 rounded-full bg-success-100">
                  <Icon name="agora-line-check-circle" className="w-32 h-32 text-success-600" />
                </div>
                <div>
                  <h1 className="text-2xl-bold text-brand-blue-dark mb-16">
                    {t("resetPassword.successTitle")}
                  </h1>
                  <p className="text-neutral-900">
                    {t("resetPassword.successDescription")}
                  </p>
                </div>
                <div>
                  <Button
                    variant="primary"
                    className="px-48 h-56 text-lg font-bold shadow-md hover:shadow-lg transition-all"
                    onClick={() => (window.location.href = localizeHref("/login"))}
                  >
                    {t("resetPassword.signIn")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-32">
                <div>
                  <h1 className="text-2xl-bold text-brand-blue-dark mb-8">
                    {t("resetPassword.title")}
                  </h1>
                  <p className="text-neutral-900">
                    {t("resetPassword.requiredFields")}
                  </p>
                </div>

                {error && <StatusCard variant="danger" showIcon description={error} />}

                <form
                  className="flex flex-col gap-24"
                  onSubmit={handleSubmit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      e.currentTarget.requestSubmit();
                    }
                  }}
                >
                  <div className="flex flex-col gap-8">
                    <InputPassword
                      label={t("resetPassword.newPassword")}
                      placeholder={t("resetPassword.newPasswordPlaceholder")}
                      id="password"
                      name="password"
                      className="w-full"
                      disabled={isLoading}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <p className="text-sm text-neutral-600">
                      {t("resetPassword.requirements")}
                    </p>
                  </div>

                  <InputPassword
                    label={t("resetPassword.confirmPassword")}
                    placeholder={t("resetPassword.confirmPasswordPlaceholder")}
                    id="password-confirm"
                    name="password_confirm"
                    className="w-full"
                    disabled={isLoading}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                  />

                  {passwordConfirm && !passwordsMatch && (
                    <p className="text-sm text-danger-600">{t("resetPassword.mismatch")}</p>
                  )}

                  <div className="mt-8">
                    <Button
                      variant="primary"
                      type="submit"
                      className="px-48 h-56 text-lg font-bold shadow-md hover:shadow-lg transition-all"
                      disabled={!canSubmit}
                    >
                      {isLoading ? t("resetPassword.submitting") : t("resetPassword.submit")}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
