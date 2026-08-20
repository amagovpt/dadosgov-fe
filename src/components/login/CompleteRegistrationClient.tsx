"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button, InputText, StatusCard, Icon } from "@ama-pt/agora-design-system";
import BreadcrumbDynamic from "@/components/Shared/BreadcrumbDynamic";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { requestEmailChange } from "@/service/api/profile";
import { PRIMARY_BUTTON_CLASS } from "./constants";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Flash codes from the backend confirm-change-email redirect → i18n keys.
const FLASH_ERRORS: Record<string, string> = {
  change_email_already_taken: "completeRegistration.flash.alreadyTaken",
  change_email_invalid: "completeRegistration.flash.invalid",
  change_email_expired: "completeRegistration.flash.expired",
};

const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Page shown to CMD/SAML accounts that still hold a minted
 * saml-*@autenticacao.gov.pt placeholder email. Registration only concludes
 * once the user provides a valid email and clicks the confirmation link
 * mailed to it (Flask-Security change-email flow via /auth/change-email).
 */
export default function CompleteRegistrationClient() {
  const { t } = useTranslation("login");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isLoading: isAuthLoading, pendingRegistration } = useAuth();

  const [email, setEmail] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  // Confirmation-link failure forwarded as ?flash=... — latched on first
  // render (NewAccountNotice pattern) so it survives the URL cleanup below.
  const [flashKey, setFlashKey] = useState<string | null>(() => {
    const flash = searchParams.get("flash");
    return flash ? (FLASH_ERRORS[flash] ?? null) : null;
  });

  const displayedError = error ?? (flashKey ? t(flashKey) : null);

  // Only pending-registration users belong here: anonymous visitors go to
  // login, completed accounts go home.
  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      router.replace("/login");
    } else if (!pendingRegistration) {
      router.replace("/");
    }
  }, [isAuthLoading, user, pendingRegistration, router]);

  // Strip the ?flash= parameter from the URL after latching it above.
  useEffect(() => {
    if (!searchParams.get("flash")) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("flash");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [searchParams, pathname, router]);

  // Resend cooldown timer.
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const emailValid = EMAIL_RE.test(email.trim());
  const emailsMatch = email.trim() !== "" && email.trim() === emailConfirm.trim();
  const canSubmit = emailValid && emailsMatch && !isSubmitting;

  const submitEmail = async (address: string) => {
    setIsSubmitting(true);
    setError(null);
    setFlashKey(null);
    try {
      await requestEmailChange(address);
      setSentTo(address);
      setResendCountdown(RESEND_COOLDOWN_SECONDS);
    } catch (err: unknown) {
      if ((err as { status?: number }).status === 429) {
        setError(t("completeRegistration.errorRateLimited"));
      } else if (err instanceof Error && err.message && err.message !== "Failed to fetch") {
        setError(err.message);
      } else {
        setError(t("completeRegistration.errorRequest"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid) {
      setError(t("completeRegistration.invalidEmail"));
      return;
    }
    if (!emailsMatch) {
      setError(t("completeRegistration.mismatch"));
      return;
    }
    await submitEmail(email.trim());
  };

  if (isAuthLoading || !user || !pendingRegistration) {
    return (
      <main className="min-h-screen flex-grow bg-white">
        <div className="container mx-auto max-w-7xl px-16 pb-64 pt-32">
          <p className="text-lg text-neutral-700">{t("completeRegistration.loading")}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen flex-grow bg-white">
      <div className="container mx-auto max-w-7xl px-16 pb-64 pt-32">
        <div className="mb-32">
          <BreadcrumbDynamic darkMode={false} path="/complete-registration" />
        </div>

        <div className="grid gap-32 xl:grid-cols-12">
          <div className="xl:col-span-3" />
          <div className="xl:col-span-6 xl:col-start-4">
            {sentTo ? (
              <div className="flex flex-col gap-32">
                <div className="flex h-64 w-64 items-center justify-center rounded-full bg-success-100">
                  <Icon name="agora-line-mail" className="h-32 w-32 text-success-600" />
                </div>
                <div>
                  <h1 className="mb-16 text-2xl-bold text-brand-blue-dark">
                    {t("completeRegistration.sentTitle")}
                  </h1>
                  <p className="text-neutral-900">
                    {t("completeRegistration.sentDescription", { email: sentTo })}
                  </p>
                </div>

                {displayedError && <StatusCard variant="danger" showIcon description={displayedError} />}

                <div className="flex items-center gap-16">
                  <Button
                    variant="neutral"
                    onClick={() => submitEmail(sentTo)}
                    disabled={isSubmitting || resendCountdown > 0}
                  >
                    {resendCountdown > 0
                      ? `${t("completeRegistration.resend")} (${resendCountdown}s)`
                      : t("completeRegistration.resend")}
                  </Button>
                  <Button
                    variant="primary"
                    appearance="link"
                    onClick={() => {
                      setSentTo(null);
                      setError(null);
                    }}
                    className="text-sm h-auto p-0"
                  >
                    {t("completeRegistration.changeAddress")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-32">
                <div className="w-fit rounded-8 bg-[#E9EBFF] p-16">
                  <Icon name="agora-line-mail" className="h-24 w-24 text-brand-blue-primary" />
                </div>
                <div>
                  <h1 className="mb-8 text-2xl-bold text-brand-blue-dark">
                    {t("completeRegistration.title")}
                  </h1>
                  <p className="mb-8 text-neutral-900">
                    {t("completeRegistration.description")}
                  </p>
                  <p className="text-sm text-neutral-700">
                    {t("completeRegistration.requiredFields")}
                  </p>
                </div>

                {displayedError && <StatusCard variant="danger" showIcon description={displayedError} />}

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
                  <InputText
                    label={t("completeRegistration.emailLabel")}
                    placeholder={t("completeRegistration.emailPlaceholder")}
                    id="new-email"
                    name="new_email"
                    type="email"
                    autoComplete="email"
                    className="w-full"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEmail(e.target.value)
                    }
                    disabled={isSubmitting}
                    hasError={email !== "" && !emailValid}
                  />
                  <InputText
                    label={t("completeRegistration.emailConfirmLabel")}
                    placeholder={t("completeRegistration.emailPlaceholder")}
                    id="new-email-confirm"
                    name="new_email_confirm"
                    type="email"
                    autoComplete="email"
                    className="w-full"
                    value={emailConfirm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEmailConfirm(e.target.value)
                    }
                    disabled={isSubmitting}
                    hasError={emailConfirm !== "" && !emailsMatch}
                    hasFeedback={emailConfirm !== "" && !emailsMatch}
                    feedbackText={t("completeRegistration.mismatch")}
                    feedbackState="danger"
                  />

                  <div>
                    <Button
                      variant="primary"
                      type="submit"
                      className={PRIMARY_BUTTON_CLASS}
                      disabled={!canSubmit}
                    >
                      {isSubmitting
                        ? t("completeRegistration.submitting")
                        : t("completeRegistration.submit")}
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
