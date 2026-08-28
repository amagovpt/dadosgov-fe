"use client";

import React, { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import { Button, InputText, InputPassword, Icon } from "@ama-pt/agora-design-system";
import BreadcrumbDynamic from "@/components/Shared/BreadcrumbDynamic";
import { fetchMigrationPending, sendMigrationLink, confirmMigration, skipMigration, resendMigrationConfirmation } from "@/service/api/migration";
import { useTranslation } from "react-i18next";
import { PasswordRecoveryView } from "./PasswordRecoveryView";
import { RECAPTCHA_KEY } from "./constants";

// Same shape check and cooldown as CompleteRegistrationClient, the portal's
// other "submit an email, then check your inbox" screen.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_CONFIRM_COOLDOWN_SECONDS = 60;

// Outcomes the backend's confirm-link route forwards as ?flash=... → i18n key.
// Same latch-and-strip shape as CompleteRegistrationClient.
const FLASH_ERRORS: Record<string, string> = {
  migration_link_expired: "migration.flash.linkExpired",
  migration_link_invalid: "migration.flash.linkInvalid",
  migration_link_already_done: "migration.flash.linkAlreadyDone",
};

// The credentials screen resolves the account by itself -- the password names
// it and the backend links whichever one it proves -- so the steps that used
// to ask "is this yours?", offer a search, or offer a choice of proof are gone
// (LEDG-2360). And no step ends authenticated any more: the validation link
// does that, on its own route.
type Step =
  | "loading"
  | "login"
  | "recover"
  | "link-sent"
  | "link-error"
  | "enter-email"
  | "confirmation-pending"
  | "success-new";

/**
 * The reCAPTCHA provider has to be an ancestor of PasswordRecoveryView, which
 * reads useGoogleReCaptcha. Without it the hook hands back no executeRecaptcha,
 * the request goes out with recaptcha_token null, and the backend's
 * ExtendedForgotPasswordForm rejects it — a recovery that fails silently. It
 * lives here rather than on the page because the page is a Server Component,
 * and it is conditional on the key exactly as LoginClient does it.
 */
export default function MigrateAccountClient() {
  if (RECAPTCHA_KEY) {
    return (
      <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_KEY} language="pt">
        <MigrateAccountWizard />
      </GoogleReCaptchaProvider>
    );
  }
  return <MigrateAccountWizard />;
}

function MigrateAccountWizard() {
  const { t } = useTranslation("login");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Latched on the first render, before the bootstrap effect can act on it.
  // Without the latch the strip below would erase the reason for being here.
  const [flashKey] = useState<string | null>(() => {
    const flash = searchParams.get("flash");
    return flash ? (FLASH_ERRORS[flash] ?? null) : null;
  });

  const [step, setStep] = useState<Step>(flashKey ? "link-error" : "loading");
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  // Which identity is being linked. Named on every screen, and only the
  // backend knows it -- both ACS routes converge before the wizard opens.
  const [provider, setProvider] = useState<"cmd" | "eidas">("cmd");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Validation-link branch: the cooldown on the resend button. The backend
  // caps the sends; this only stops the button being hammered.
  const [resendCountdown, setResendCountdown] = useState(0);

  // Account-creation branch: the address the user submits, and the one the
  // account ended up with (echoed by the backend for the "check your email"
  // screen). No session exists at that point — the confirmation link is what
  // eventually grants one.
  const [newEmail, setNewEmail] = useState("");
  const [createdEmail, setCreatedEmail] = useState("");
  const [resendConfirmCountdown, setResendConfirmCountdown] = useState(0);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  // Default account login (email + password)
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");

  // Check pending migration on mount
  useEffect(() => {
    // A visitor arriving from a spent or expired link has no wizard session,
    // and the bootstrap below answers that with router.push("/login") — which
    // would swallow the very message they were sent here to read.
    if (flashKey) return;
    async function check() {
      try {
        const data = await fetchMigrationPending();
        if (!data.pending) {
          // The wizard is over, but the account it created is still waiting
          // on its confirmation link — a repeat CMD login lands here. Say so
          // and offer a resend, instead of a silent bounce to the login.
          if (data.awaiting_confirmation) {
            if (data.email) setMaskedEmail(data.email);
            setStep("confirmation-pending");
            return;
          }
          router.push("/login");
          return;
        }
        if (data.email) setMaskedEmail(data.email);
        if (data.provider) setProvider(data.provider);
        // Pre-fill the creation step with the CMD address when it is free.
        // It still has to be submitted explicitly — this is a convenience,
        // not a decision taken on the user's behalf.
        if (data.suggested_email) setNewEmail(data.suggested_email);
        // Two outcomes now, not three. The credentials screen does not depend
        // on a candidate being pointed -- the backend links the account whose
        // password is proved, homonyms included -- so a matched candidate and
        // an ambiguous set of homonyms land on the same screen, and the user
        // types the address they know instead of searching for it.
        //   no_match  -> nothing matched at all: go create an account
        //   otherwise -> go prove which account is yours
        if (data.no_match) {
          setStep("enter-email");
        } else {
          setStep("login");
        }
      } catch {
        router.push("/login");
      }
    }
    check();
  }, [router, flashKey]);

  // Strip the ?flash= parameter once it has been latched.
  useEffect(() => {
    if (!searchParams.get("flash")) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("flash");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [searchParams, pathname, router]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  // Same ticker for the confirmation-link resend on the terminal screen.
  useEffect(() => {
    if (resendConfirmCountdown <= 0) return;
    const timer = setTimeout(() => setResendConfirmCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendConfirmCountdown]);

  // The backend answers a spent allowance with this exact string. Its own
  // message, not the account-creation one: that cap is for the life of the
  // account, this one lifts after an hour, so "contact support" would be
  // wrong advice here.
  const linkSendError = useCallback(
    (err: unknown) => {
      const message = err instanceof Error ? err.message : "";
      return message === "Maximum confirmation sends exceeded"
        ? t("migration.errorTooManyLinkSends")
        : t("migration.errorSendLink");
    },
    [t]
  );

  const handleResendLink = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await sendMigrationLink();
      setResendCountdown(RESEND_CONFIRM_COOLDOWN_SECONDS);
    } catch (err: unknown) {
      setError(linkSendError(err));
    } finally {
      setIsLoading(false);
    }
  }, [linkSendError]);

  const handleLogin = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await confirmMigration({ method: "password", email: loginEmail, password });
      // The proof is in; the link is what finishes the job. Arm the cooldown
      // here, because the send already happened on the server.
      setResendCountdown(RESEND_CONFIRM_COOLDOWN_SECONDS);
      setStep("link-sent");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      // A correct password can now fail on the send cap or on a broken wizard
      // session. Both used to be impossible here, and falling through to
      // "credenciais inválidas" would tell the user their password is wrong
      // when it is not.
      if (message.includes("Maximum attempts")) {
        setError(t("migration.errorMaximumAttempts"));
      } else if (message === "Maximum confirmation sends exceeded") {
        setError(t("migration.errorTooManyLinkSends"));
      } else if (message === "nic_required") {
        // Nothing to bind: the assertion carried no civil id. Not recoverable
        // by re-authenticating, so it must not say the session expired.
        setError(t("migration.errorNicMissing"));
      } else if (message === "No pending migration") {
        setError(t("migration.errorSessionLost"));
      } else {
        setError(t("migration.errorInvalidCredentials"));
      }
    } finally {
      setIsLoading(false);
    }
  }, [loginEmail, password, t]);

  const handleCreateAccount = useCallback(async () => {
    const email = newEmail.trim();
    if (!EMAIL_RE.test(email)) {
      setError(t("migration.errorInvalidEmail"));
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // One outcome, on purpose. The backend used to say whether the address
      // was already taken, and routing on that answer is what made the wizard
      // an enumeration oracle for anyone holding a CMD session. Both cases now
      // end here, and what differs is only the mail that arrives: a
      // confirmation link for a new account, or a notice that one already
      // exists. That costs the shortcut LEDG-2351 added -- the owner of a
      // legacy address is no longer walked straight to the credentials screen
      // -- and the mail tells them what to do instead.
      const data = await skipMigration(email);
      setCreatedEmail(data.email || email);
      setResendConfirmCountdown(RESEND_CONFIRM_COOLDOWN_SECONDS);
      setStep("success-new");
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      // Each rejection is correctable in place — the pending migration
      // survives the error, so the user can fix the address and resubmit.
      // None of them depends on whether the address already has an account.
      if (code === "invalid_email" || code === "email_required") {
        setError(t("migration.errorInvalidEmail"));
      } else if (code === "nic_required") {
        // The identity carried no NIC, so it cannot create an account through
        // this flow. Nothing the user can correct here — say so rather than
        // leaving them retrying a form that will never succeed.
        setError(t("migration.errorNicRequired"));
      } else if (code === "identity_already_registered") {
        setError(t("migration.errorIdentityRegistered"));
      } else if (code === "too_many_sends") {
        setError(t("migration.errorTooManySends"));
      } else {
        setError(t("migration.errorCreateAccount"));
      }
    } finally {
      setIsLoading(false);
    }
  }, [newEmail, t]);

  const handleResendConfirmation = useCallback(async () => {
    setError(null);
    setResendNotice(null);
    setIsLoading(true);
    try {
      const data = await resendMigrationConfirmation();
      if (data.confirmed) {
        setResendNotice(t("migration.confirmationAlreadyDone"));
      } else {
        setResendNotice(t("migration.confirmationResent"));
        setResendConfirmCountdown(RESEND_CONFIRM_COOLDOWN_SECONDS);
      }
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      setError(
        code === "Maximum confirmation sends exceeded"
          ? t("migration.errorTooManySends")
          : t("migration.errorResendConfirmation")
      );
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // The mockup names CMD in full; eIDAS has to read correctly on the same
  // screens, and criterion 7 requires the flow to serve both.
  const providerName =
    provider === "eidas" ? t("migration.providerEidas") : t("migration.providerCmd");

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
            {/* The bootstrap is skipped when a flash brought the user here, so
                the provider was never read: naming one would be a guess, and
                on this screen it would always guess CMD. */}
            {step === "link-error"
              ? t("migration.linkTitleGeneric")
              : t("migration.linkTitle", { provider: providerName })}
          </h1>

          {/* link-error is excluded for the same reason as the h1: the provider
              was never read there. It carries its own title and reason. */}
          {step !== "success-new" &&
            step !== "confirmation-pending" &&
            step !== "recover" &&
            step !== "link-error" && (
            <p className="text-lg mb-32 text-neutral-700">
              {t("migration.linkDescription", { provider: providerName })}
            </p>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 text-sm border-red-200 mb-24 rounded-8 border p-16 font-medium">
              {error}
            </div>
          )}

          {/* Step: Initial choice — link an existing account or create a new one */}
          {/* Step: Default account login (email + password) */}
          {step === "login" && (
            <div className="flex flex-col gap-24">
              <div className="w-fit rounded-8 bg-[#E9EBFF] p-16">
                <Icon name="agora-line-lock" className="h-24 w-24 text-brand-blue-primary" />
              </div>
              <h2 className="text-xl-bold text-brand-blue-dark">
                {t("migration.signInTitle", { provider: providerName })}
              </h2>
              <p className="text-neutral-900">
                {t("migration.signInDescription", { provider: providerName })}
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
                  {isLoading
                    ? t("migration.checking")
                    : t("migration.linkAccount", { provider: providerName })}
                </Button>
              </div>

              {/* Recovery runs inline: the pending migration is untouched by
                  it, so the CMD/eIDAS identity survives and the user can come
                  straight back and finish. Sending them to /login instead
                  would cost them the identity they just proved. */}
              <Button
                variant="primary"
                appearance="link"
                onClick={() => {
                  setStep("recover");
                  setError(null);
                }}
                className="text-sm h-auto p-0"
              >
                {t("migration.forgotPassword")}
              </Button>

              {/* The homonym with no account of their own used to escape by
                  answering "no" to "is this yours?". That question is gone, so
                  the way out lives here. */}
              <Button
                variant="primary"
                appearance="link"
                onClick={() => {
                  setStep("enter-email");
                  setError(null);
                }}
                className="text-sm h-auto p-0"
              >
                {t("migration.createNewAccount")}
              </Button>
            </div>
          )}

          {/* Step: request a password reset without leaving the wizard. */}
          {step === "recover" && (
            <div className="flex flex-col gap-24">
              <PasswordRecoveryView
                onBack={() => {
                  setStep("login");
                  setError(null);
                }}
              />
            </div>
          )}

          {/* Step: the validation link is out. Same layout as the
              confirmation-pending screen the account-creation branch ends on,
              because it is the same situation: the mail is what carries the
              flow on, and nothing here is authenticated until it is followed. */}
          {step === "link-sent" && (
            <div className="flex flex-col items-center gap-24 text-center">
              <div className="bg-blue-100 w-fit rounded-full p-24">
                <Icon name="agora-line-mail" className="text-brand-blue-dark h-48 w-48" />
              </div>
              <h2 className="text-xl-bold text-brand-blue-dark">
                {t("migration.linkSentTitle")}
              </h2>
              <p className="text-neutral-900">{t("migration.linkSentDescription")}</p>

              <Button
                variant="primary"
                appearance="link"
                onClick={handleResendLink}
                disabled={isLoading || resendCountdown > 0}
                className="text-sm h-auto p-0"
              >
                {resendCountdown > 0
                  ? `${t("migration.resendLink")} (${resendCountdown}s)`
                  : t("migration.resendLink")}
              </Button>

              <Button
                variant="primary"
                appearance="link"
                onClick={() => {
                  setStep("login");
                  setError(null);
                }}
                className="text-sm h-auto p-0"
              >
                {t("migration.back")}
              </Button>
            </div>
          )}

          {/* Step: A confirmation is already pending for this identity's
              account. Reached by logging in again with the CMD before
              following the link. Terminal and unauthenticated. */}
          {step === "confirmation-pending" && (
            <div className="flex flex-col items-center gap-24 text-center">
              <div className="bg-blue-100 w-fit rounded-full p-24">
                <Icon name="agora-line-mail" className="text-brand-blue-dark h-48 w-48" />
              </div>
              <h2 className="text-xl-bold text-brand-blue-dark">
                {t("migration.confirmationPendingTitle")}
              </h2>
              <p className="text-neutral-900">
                {t("migration.confirmationPendingDescription", { email: maskedEmail || "" })}
              </p>

              {resendNotice && <p className="text-green-700">{resendNotice}</p>}

              <Button
                variant="primary"
                appearance="link"
                onClick={handleResendConfirmation}
                disabled={isLoading || resendConfirmCountdown > 0}
                className="text-sm h-auto p-0"
              >
                {resendConfirmCountdown > 0
                  ? `${t("migration.resendConfirmation")} (${resendConfirmCountdown}s)`
                  : t("migration.resendConfirmation")}
              </Button>
            </div>
          )}

          {/* Step: the emailed link did not work out. Reached by redirect
              from the backend's confirm-link route, with no session — the
              recovery is to authenticate again, since after a consumed or
              re-pointed link there is nothing left to resend from. That holds
              for the expired case too: the backend deliberately does not
              reissue from a link click, because mail scanners open links
              before their owners do. */}
          {step === "link-error" && (
            <div className="flex flex-col items-center gap-24 text-center">
              <div className="bg-blue-100 w-fit rounded-full p-24">
                <Icon name="agora-line-mail" className="text-brand-blue-dark h-48 w-48" />
              </div>
              <h2 className="text-xl-bold text-brand-blue-dark">
                {t("migration.linkErrorTitle")}
              </h2>
              <p className="text-neutral-900">{flashKey ? t(flashKey) : ""}</p>

              <Button variant="primary" onClick={() => router.push("/login")}>
                {t("migration.linkErrorAction")}
              </Button>
            </div>
          )}

          {/* Step: Collect the email the new account will be created with.
              Cannot be skipped: no account exists until this is submitted. */}
          {step === "enter-email" && (
            <div className="flex flex-col gap-16">
              <p className="text-neutral-900">{t("migration.enterEmailDescription")}</p>

              <InputText
                label={t("migration.email")}
                placeholder={t("migration.emailPlaceholder")}
                id="new-account-email"
                name="new-account-email"
                type="email"
                className="w-full"
                value={newEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setNewEmail(e.target.value);
                  setError(null);
                }}
                disabled={isLoading}
              />

              <div className="mt-16 flex gap-16">
                <Button
                  variant="primary"
                  onClick={handleCreateAccount}
                  disabled={isLoading || !newEmail.trim()}
                  className="px-48"
                >
                  {isLoading ? t("migration.creatingAccount") : t("migration.createAccount")}
                </Button>
              </div>

              {/* Someone sent straight here because nothing matched may still
                  have an account under an address they know. The credentials
                  screen is where that is settled now -- there is no search. */}
              <Button
                variant="primary"
                appearance="link"
                onClick={() => {
                  setStep("login");
                  setError(null);
                }}
                className="text-sm h-auto p-0"
              >
                {t("migration.searchMyAccount")}
              </Button>
            </div>
          )}

          {/* Step: Account created, confirmation sent. Terminal and
              UNAUTHENTICATED — the link in the email is what grants access,
              so there is nothing to redirect to. */}
          {step === "success-new" && (
            <div className="flex flex-col items-center gap-24 text-center">
              <div className="bg-blue-100 w-fit rounded-full p-24">
                <Icon name="agora-line-mail" className="text-brand-blue-dark h-48 w-48" />
              </div>
              <h2 className="text-xl-bold text-brand-blue-dark">{t("migration.successNewTitle")}</h2>
              <p className="text-neutral-900">
                {t("migration.successNewDescription", { email: createdEmail })}
              </p>

              {resendNotice && <p className="text-green-700">{resendNotice}</p>}

              <Button
                variant="primary"
                appearance="link"
                onClick={handleResendConfirmation}
                disabled={isLoading || resendConfirmCountdown > 0}
                className="text-sm h-auto p-0"
              >
                {resendConfirmCountdown > 0
                  ? `${t("migration.resendConfirmation")} (${resendConfirmCountdown}s)`
                  : t("migration.resendConfirmation")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
