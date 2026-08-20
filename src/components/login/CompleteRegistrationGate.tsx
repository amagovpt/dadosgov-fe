"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// Flash codes emitted by the backend confirm-change-email redirect that the
// complete-registration page knows how to render. Anything else stays behind.
const FORWARDED_FLASHES = new Set([
  "change_email_already_taken",
  "change_email_invalid",
  "change_email_expired",
]);

/**
 * Global navigation gate for accounts that still hold a minted
 * saml-*@autenticacao.gov.pt placeholder email (CMD/SAML registration not
 * concluded). While `pending_registration` is set on /me, every localized
 * page redirects to /complete-registration, where the user must provide a
 * valid email.
 *
 * Confirmation-link failures (expired/invalid/already-taken) land on the
 * homepage with a `?flash=` code — the redirect forwards it so the page can
 * explain what went wrong.
 *
 * Renders nothing; mounted globally next to <NewAccountNotice /> in the
 * locale layout. Route handlers (/auth/*, /saml/*) live outside [locale]
 * and are unaffected.
 */
export default function CompleteRegistrationGate() {
  const { isLoading, pendingRegistration } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (isLoading || !pendingRegistration) return;
    if (pathname.includes("/complete-registration")) return;

    const flash = searchParams.get("flash");
    const target =
      flash && FORWARDED_FLASHES.has(flash)
        ? `/complete-registration?flash=${encodeURIComponent(flash)}`
        : "/complete-registration";
    // Plain path: src/proxy.ts i18nRouter injects the locale prefix.
    router.replace(target);
  }, [isLoading, pendingRegistration, pathname, searchParams, router]);

  return null;
}
