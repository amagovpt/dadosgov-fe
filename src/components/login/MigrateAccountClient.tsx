"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button, InputText, InputPassword, Icon } from "@ama-pt/agora-design-system";
import BreadcrumbDynamic from "@/components/Shared/BreadcrumbDynamic";
import { fetchMigrationPending, searchMigrationAccount, sendMigrationCode, confirmMigration, skipMigration } from "@/service/api/migration";
import AppIcon from "../Primitives/AppIcon";
import { useTranslation } from "react-i18next";

type Step =
  | "loading"
  | "choice"
  | "login"
  | "search"
  | "confirm-account"
  | "choose-method"
  | "verify-code"
  | "success"
  | "success-new";

export default function MigrateAccountClient() {
  const { t } = useTranslation("login");
  const router = useRouter();

  const [step, setStep] = useState<Step>("loading");
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [hasCandidate, setHasCandidate] = useState(false);
  const [legacyFirstName, setLegacyFirstName] = useState<string | null>(null);
  const [legacyLastName, setLegacyLastName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Search form
  const [searchEmail, setSearchEmail] = useState("");
  const [searchFirstName, setSearchFirstName] = useState("");
  const [searchLastName, setSearchLastName] = useState("");
  const [searchByName, setSearchByName] = useState(false);

  // Code verification
  const [code, setCode] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);

  // Set when the skipped (new) account got a saml-* placeholder email: the
  // success redirect must land on /complete-registration instead of home.
  const [needsEmail, setNeedsEmail] = useState(false);

  // Default account login (email + password)
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");

  // Check pending migration on mount
  useEffect(() => {
    async function check() {
      try {
        const data = await fetchMigrationPending();
        if (!data.pending) {
          router.push("/login");
          return;
        }
        if (data.email) setMaskedEmail(data.email);
        setHasCandidate(Boolean(data.candidate));
        if (data.first_name) setLegacyFirstName(data.first_name);
        if (data.last_name) setLegacyLastName(data.last_name);

        // The flow always starts by asking the user whether they
        // already have an account or want to create a new one.
        setStep("choice");
      } catch {
        router.push("/login");
      }
    }
    check();
  }, [router]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = searchByName
        ? { first_name: searchFirstName, last_name: searchLastName }
        : { email: searchEmail };
      const data = await searchMigrationAccount(payload);
      if (data.found) {
        setMaskedEmail(data.email || null);
        // Re-fetch pending to get updated name from the found account
        const pending = await fetchMigrationPending();
        if (pending.first_name) setLegacyFirstName(pending.first_name);
        if (pending.last_name) setLegacyLastName(pending.last_name);
        setStep("confirm-account");
      } else {
        setError(t("migration.errorNotFound"));
      }
    } catch {
      setError(t("migration.errorSearch"));
    } finally {
      setIsLoading(false);
    }
  }, [searchByName, searchFirstName, searchLastName, searchEmail]);

  const handleSendCode = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await sendMigrationCode();
      setResendCountdown(60);
      setStep("verify-code");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("migration.errorSendCode"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleResendCode = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await sendMigrationCode();
      setResendCountdown(60);
      setCode("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("migration.errorResendCode"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleConfirmCode = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await confirmMigration({ method: "code", code });
      setStep("success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("migration.errorInvalidCode"));
    } finally {
      setIsLoading(false);
    }
  }, [code]);

  const handleLogin = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await confirmMigration({ method: "password", email: loginEmail, password });
      setStep("success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("Maximum attempts")) {
        setError(
          t("migration.errorMaximumAttempts")
        );
      } else {
        setError(t("migration.errorInvalidCredentials"));
      }
    } finally {
      setIsLoading(false);
    }
  }, [loginEmail, password, t]);

  const handleSkip = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await skipMigration();
      setNeedsEmail(Boolean(data.pending_registration));
      setStep("success-new");
    } catch {
      setError(t("migration.errorCreateAccount"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleForgotPassword = useCallback(() => {
    setError(null);
    // With a known candidate account we can email a code right away;
    // otherwise the user must locate the account first.
    if (hasCandidate) {
      setStep("confirm-account");
    } else {
      setStep("search");
    }
  }, [hasCandidate]);

  // Redirect after success (account linked or new account created). A new
  // account holding a placeholder email must complete registration first.
  // Full reload on purpose: it refreshes AuthContext with the new session.
  useEffect(() => {
    if (step !== "success" && step !== "success-new") return;
    const destination =
      step === "success-new" && needsEmail ? "/complete-registration" : "/";
    const timer = setTimeout(() => {
      window.location.href = destination;
    }, 3000);
    return () => clearTimeout(timer);
  }, [step, needsEmail]);

  if (step === "loading") {
    return (
      <main className="min-h-screen flex-grow bg-white">
        <div className="container mx-auto max-w-7xl px-16 pb-64 pt-32">
          <p className="text-lg text-neutral-700">{t("migration.loading")}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex-grow bg-white">
      <div className="container mx-auto max-w-7xl px-16 pb-64 pt-32">
        <div>
          <BreadcrumbDynamic darkMode={false} />
        </div>

        <div className="mt-64 max-w-[560px]">
          <h1 className="mb-16 text-2xl-medium text-brand-blue-dark">
            {t("migration.linkTitle")}
          </h1>

          {step !== "success" && step !== "success-new" && step !== "choice" && (
            <p className="text-lg mb-32 text-neutral-700">
              {t("migration.linkDescription")}
            </p>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 text-sm border-red-200 mb-24 rounded-8 border p-16 font-medium">
              {error}
            </div>
          )}

          {/* Step: Initial choice — link an existing account or create a new one */}
          {step === "choice" && (
            <div className="flex flex-col gap-24">
              <div className="w-fit rounded-8 bg-[#E9EBFF] p-16">
                <Icon name="agora-line-user" className="h-24 w-24 text-brand-blue-primary" />
              </div>
              <h2 className="text-xl-bold text-brand-blue-dark">
                {hasCandidate
                  ? t("migration.accountFound")
                  : t("migration.hasAccount")}
              </h2>
              <p className="text-neutral-900">
                {hasCandidate
                  ? t("migration.accountFoundDescription")
                  : t("migration.noAccountDescription")}
              </p>

              <div className="flex flex-col gap-16">
                <button
                  onClick={() => {
                    setError(null);
                    setStep("login");
                  }}
                  disabled={isLoading}
                  className="flex items-center gap-16 rounded-8 border-2 border-neutral-300 p-24 text-left transition-colors hover:border-brand-blue-primary"
                >
                  <div className="shrink-0 rounded-8 bg-[#E9EBFF] p-12">
                    <Icon name="agora-line-lock" className="h-24 w-24 text-brand-blue-primary" />
                  </div>
                  <div>
                    <p className="text-lg-bold text-brand-blue-dark">{t("migration.existingAccount")}</p>
                    <p className="text-sm text-neutral-700">
                      {t("migration.existingAccountDescription")}
                    </p>
                  </div>
                </button>

                <button
                  onClick={handleSkip}
                  disabled={isLoading}
                  className="flex items-center gap-16 rounded-8 border-2 border-neutral-300 p-24 text-left transition-colors hover:border-brand-blue-primary"
                >
                  <div className="shrink-0 rounded-8 bg-[#E9EBFF] p-12">
                    <Icon
                      name="agora-line-add-circle"
                      className="h-24 w-24 text-brand-blue-primary"
                    />
                  </div>
                  <div>
                    <p className="text-lg-bold text-brand-blue-dark">{t("migration.newAccount")}</p>
                    <p className="text-sm text-neutral-700">
                      {isLoading
                        ? t("migration.creatingAccount")
                        : t("migration.newAccountDescription")}
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step: Default account login (email + password) */}
          {step === "login" && (
            <div className="flex flex-col gap-24">
              <div className="w-fit rounded-8 bg-[#E9EBFF] p-16">
                <Icon name="agora-line-lock" className="h-24 w-24 text-brand-blue-primary" />
              </div>
              <h2 className="text-xl-bold text-brand-blue-dark">{t("migration.signInTitle")}</h2>
              <p className="text-neutral-900">
                {t("migration.signInDescription")}
              </p>

              <InputText
                label={t("migration.email")}
                placeholder={t("migration.emailExample")}
                id="login-email"
                name="login-email"
                type="email"
                className="w-full"
                value={loginEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setLoginEmail(e.target.value)
                }
                disabled={isLoading}
              />
              <InputPassword
                label={t("migration.password")}
                placeholder={t("migration.passwordPlaceholder")}
                id="login-password"
                name="login-password"
                className="w-full"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                disabled={isLoading}
              />

              <div className="flex items-center gap-16">
                <Button
                  variant="primary"
                  onClick={handleLogin}
                  disabled={isLoading || !loginEmail || !password}
                  className="px-48"
                >
                  {isLoading ? t("migration.checking") : t("migration.linkAccount")}
                </Button>
              </div>

              <Button
                variant="primary"
                appearance="link"
                onClick={handleForgotPassword}
                className="text-sm h-auto p-0"
              >
                {t("migration.forgotPassword")}
              </Button>

              <Button
                variant="primary"
                appearance="link"
                onClick={() => {
                  setStep("choice");
                  setError(null);
                }}
                className="text-sm h-auto p-0"
              >
                {t("migration.back")}
              </Button>
            </div>
          )}

          {/* Step: Search for legacy account (when no email from SAML) */}
          {step === "search" && (
            <div className="flex flex-col gap-24">
              <div className="w-fit rounded-8 bg-[#E9EBFF] p-16">
                <Icon name="agora-line-search" className="h-24 w-24 text-brand-blue-primary" />
              </div>
              <h2 className="text-xl-bold text-brand-blue-dark">{t("migration.searchTitle")}</h2>
              <p className="text-neutral-900">
                {t("migration.searchDescription")}
              </p>

              <div className="mb-8 flex gap-16">
                <Button
                  variant={!searchByName ? "primary" : "neutral"}
                  onClick={() => setSearchByName(false)}
                  className="text-sm"
                >
                  {t("migration.byEmail")}
                </Button>
                <Button
                  variant={searchByName ? "primary" : "neutral"}
                  onClick={() => setSearchByName(true)}
                  className="text-sm"
                >
                  {t("migration.byName")}
                </Button>
              </div>

              {!searchByName ? (
                <InputText
                  label={t("migration.previousAccountEmail")}
                  placeholder={t("migration.emailExample")}
                  id="search-email"
                  name="search-email"
                  type="email"
                  className="w-full"
                  value={searchEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchEmail(e.target.value)
                  }
                  disabled={isLoading}
                />
              ) : (
                <>
                  <InputText
                    label={t("migration.firstName")}
                    placeholder={t("migration.firstNamePlaceholder")}
                    id="search-first-name"
                    name="search-first-name"
                    className="w-full"
                    value={searchFirstName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSearchFirstName(e.target.value)
                    }
                    disabled={isLoading}
                  />
                  <InputText
                    label={t("migration.lastName")}
                    placeholder={t("migration.lastNamePlaceholder")}
                    id="search-last-name"
                    name="search-last-name"
                    className="w-full"
                    value={searchLastName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSearchLastName(e.target.value)
                    }
                    disabled={isLoading}
                  />
                </>
              )}

              <div className="mt-16 flex gap-16">
                <Button
                  variant="primary"
                  onClick={handleSearch}
                  disabled={
                    isLoading ||
                    (!searchByName && !searchEmail) ||
                    (searchByName && (!searchFirstName || !searchLastName))
                  }
                  className="px-48"
                >
                  {isLoading ? t("migration.searching") : t("migration.searchAccount")}
                </Button>
                <Button variant="neutral" onClick={handleSkip} disabled={isLoading}>
                  {t("migration.createNewAccount")}
                </Button>
              </div>
            </div>
          )}

          {/* Step: Confirm legacy account details */}
          {step === "confirm-account" && (
            <div className="flex flex-col gap-24">
              <div className="w-fit rounded-8 bg-[#E9EBFF] p-16">
                <Icon name="agora-line-user" className="h-24 w-24 text-brand-blue-primary" />
              </div>
              <h2 className="text-xl-bold text-brand-blue-dark">{t("migration.confirmTitle")}</h2>
              <p className="text-neutral-900">
                {t("migration.confirmDescription")}
              </p>

              <div className="flex flex-col gap-16 rounded-8 border border-neutral-300 bg-neutral-50 p-24">
                {(legacyFirstName || legacyLastName) && (
                  <div className="flex items-center gap-12">
                    <AppIcon name="agora-line-user" className="shrink-0 text-neutral-600" />
                    <div>
                      <p className="text-xs text-neutral-600">{t("migration.firstName")}</p>
                      <p className="text-base-bold text-neutral-900">
                        {legacyFirstName} {legacyLastName}
                      </p>
                    </div>
                  </div>
                )}
                {maskedEmail && (
                  <div className="flex items-center gap-12">
                    <AppIcon name="agora-line-mail" className="shrink-0 text-neutral-600" />
                    <div>
                      <p className="text-xs text-neutral-600">{t("migration.email")}</p>
                      <p className="text-base-bold text-neutral-900">{maskedEmail}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex gap-16">
                <Button
                  variant="primary"
                  onClick={() => {
                    setError(null);
                    setStep("choose-method");
                  }}
                  className="px-48"
                >
                  {t("migration.confirmYes")}
                </Button>
                <Button variant="neutral" onClick={handleSkip} disabled={isLoading}>
                  {t("migration.confirmNo")}
                </Button>
              </div>
            </div>
          )}

          {/* Step: Choose verification method */}
          {step === "choose-method" && (
            <div className="flex flex-col gap-24">
              <div className="w-fit rounded-8 bg-[#E9EBFF] p-16">
                <Icon name="agora-line-shield" className="h-24 w-24 text-brand-blue-primary" />
              </div>
              <h2 className="text-xl-bold text-brand-blue-dark">{t("migration.verifyTitle")}</h2>
              <p className="text-neutral-900">
                {t("migration.verifyDescription")}
              </p>

              <div className="flex flex-col gap-16">
                <button
                  onClick={handleSendCode}
                  disabled={isLoading}
                  className="flex items-center gap-16 rounded-8 border-2 border-neutral-300 p-24 text-left transition-colors hover:border-brand-blue-primary"
                >
                  <div className="shrink-0 rounded-8 bg-[#E9EBFF] p-12">
                    <Icon name="agora-line-mail" className="h-24 w-24 text-brand-blue-primary" />
                  </div>
                  <div>
                    <p className="text-lg-bold text-brand-blue-dark">
                      {t("migration.sendCode")}
                    </p>
                    <p className="text-sm text-neutral-700">
                      {t("migration.codeDescription", { email: maskedEmail || t("migration.email") })}
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setStep("login")}
                  disabled={isLoading}
                  className="flex items-center gap-16 rounded-8 border-2 border-neutral-300 p-24 text-left transition-colors hover:border-brand-blue-primary"
                >
                  <div className="shrink-0 rounded-8 bg-[#E9EBFF] p-12">
                    <Icon name="agora-line-lock" className="h-24 w-24 text-brand-blue-primary" />
                  </div>
                  <div>
                    <p className="text-lg-bold text-brand-blue-dark">{t("migration.knowPassword")}</p>
                    <p className="text-sm text-neutral-700">
                      {t("migration.passwordMethodDescription")}
                    </p>
                  </div>
                </button>
              </div>

              <Button
                variant="primary"
                appearance="link"
                onClick={() => {
                  setStep("confirm-account");
                  setError(null);
                }}
                className="text-sm h-auto p-0"
              >
                {t("migration.back")}
              </Button>
            </div>
          )}

          {/* Step: Verify by code */}
          {step === "verify-code" && (
            <div className="flex flex-col gap-24">
              <div className="w-fit rounded-8 bg-[#E9EBFF] p-16">
                <Icon name="agora-line-mail" className="h-24 w-24 text-brand-blue-primary" />
              </div>
              <h2 className="text-xl-bold text-brand-blue-dark">{t("migration.verifyCodeTitle")}</h2>
              <p className="text-neutral-900">
                {t("migration.codeDescription", { email: maskedEmail })}
              </p>

              <InputText
                label={t("migration.verificationCode")}
                placeholder="000000"
                id="migration-code"
                name="migration-code"
                className="w-full"
                value={code}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
                disabled={isLoading}
              />

              <div className="flex items-center gap-16">
                <Button
                  variant="primary"
                  onClick={handleConfirmCode}
                  disabled={isLoading || code.length !== 6}
                  className="px-48"
                >
                  {isLoading ? t("migration.checking") : t("migration.verify")}
                </Button>
                <Button
                  variant="neutral"
                  onClick={handleResendCode}
                  disabled={isLoading || resendCountdown > 0}
                >
                  {resendCountdown > 0 ? `${t("migration.resendCode")} (${resendCountdown}s)` : t("migration.resendCode")}
                </Button>
              </div>

              <Button
                variant="primary"
                appearance="link"
                onClick={() => {
                  setStep("choose-method");
                  setError(null);
                }}
                className="text-sm h-auto p-0"
              >
                {t("migration.back")}
              </Button>
            </div>
          )}

          {/* Step: Success — existing account linked */}
          {step === "success" && (
            <div className="flex flex-col items-center gap-24 text-center">
              <div className="bg-green-100 w-fit rounded-full p-24">
                <Icon name="agora-line-check-circle" className="text-green-600 h-48 w-48" />
              </div>
              <h2 className="text-xl-bold text-brand-blue-dark">{t("migration.successTitle")}</h2>
              <p className="text-neutral-900">
                {t("migration.successDescription")}
              </p>
            </div>
          )}

          {/* Step: Success — new account created */}
          {step === "success-new" && (
            <div className="flex flex-col items-center gap-24 text-center">
              <div className="bg-green-100 w-fit rounded-full p-24">
                <Icon name="agora-line-check-circle" className="text-green-600 h-48 w-48" />
              </div>
              <h2 className="text-xl-bold text-brand-blue-dark">{t("migration.successNewTitle")}</h2>
              <p className="text-neutral-900">
                {t("migration.successNewDescription")}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
