"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Icon } from "@ama-pt/agora-design-system";
import { Typograph } from "../Shared/Generics/Typograph";

/**
 * Outcome of clicking an email confirmation link.
 *
 * Flask-Security redirects here after handling the token — SECURITY_POST_CONFIRM_VIEW
 * and SECURITY_CONFIRM_ERROR_VIEW both point at the frontend homepage with a
 * ?flash= marker — but nothing rendered them, so the user landed on an ordinary
 * homepage with no idea whether the confirmation had worked.
 *
 * There are three outcomes, not two, and SECURITY_REDIRECT_BEHAVIOR="spa" makes
 * them distinguishable: the message travels in the query string, under `error`
 * for an invalid or expired token and under `info` for a link that was already
 * used. That last case is a success from the user's point of view — their email
 * IS confirmed — so telling them the link was invalid would send them chasing a
 * problem they do not have.
 *
 * Note there is no automatic resend: Flask-Security's confirm_email only
 * redirects. The way to get a new link is to log in with the CMD again, which
 * lands on the wizard's pending-confirmation screen.
 */
type Outcome = "success" | "already" | "error";

function readOutcome(params: URLSearchParams): Outcome | null {
  const flash = params.get("flash");
  if (flash === "post_confirm") return "success";
  if (flash !== "confirm_error") return null;
  // `info` is ALREADY_CONFIRMED; anything else on this flash is a genuine
  // failure (expired or tampered-with token).
  return params.get("info") ? "already" : "error";
}

const STYLES: Record<Outcome, { wrapper: string; icon: string; iconClass: string }> = {
  success: {
    wrapper: "border-green-300 bg-green-50",
    icon: "agora-line-check-circle",
    iconClass: "text-green-600",
  },
  already: {
    wrapper: "border-blue-300 bg-blue-50",
    icon: "agora-line-information-circle",
    iconClass: "text-brand-blue-dark",
  },
  error: {
    wrapper: "border-red-300 bg-red-50",
    icon: "agora-line-error-warning",
    iconClass: "text-red-600",
  },
};

export default function ConfirmEmailNotice() {
  const { t } = useTranslation("login");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Latched on first render so the notice survives the URL cleanup below.
  const [outcome, setOutcome] = useState<Outcome | null>(() => readOutcome(searchParams));
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!readOutcome(searchParams)) return;
    const params = new URLSearchParams(searchParams.toString());
    // The flash markers and the messages Flask-Security attaches to them.
    for (const key of ["flash", "success", "info", "error", "email", "identity"]) {
      params.delete(key);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [searchParams, pathname, router]);

  if (!outcome || dismissed) return null;

  const style = STYLES[outcome];

  return (
    <div
      role="status"
      className={`container mx-auto mt-16 flex max-w-7xl items-start gap-16 rounded-8 border p-16 ${style.wrapper}`}
    >
      <Icon name={style.icon} className={`h-24 w-24 shrink-0 ${style.iconClass}`} aria-hidden />
      <div className="flex-grow">
        <Typograph tag="p" className="text-base-bold text-neutral-900">
          {t(`confirmEmailNotice.${outcome}Title`)}
        </Typograph>
        <Typograph tag="p" className="text-sm text-neutral-700">
          {t(`confirmEmailNotice.${outcome}Description`)}
        </Typograph>
      </div>
      <button
        onClick={() => {
          setDismissed(true);
          setOutcome(null);
        }}
        aria-label={t("confirmEmailNotice.close")}
        className="shrink-0 rounded-4 p-4 text-neutral-700 hover:bg-neutral-100"
      >
        <Icon name="agora-line-close" className="h-20 w-20" aria-hidden />
      </button>
    </div>
  );
}
