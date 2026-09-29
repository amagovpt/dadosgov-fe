"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Trans, useTranslation } from "react-i18next";
import { Button, CardExpandable, Icon, StatusCard } from "@ama-pt/agora-design-system";

import { useAuth } from "@/context/AuthContext";
import { Typograph } from "../Shared/Generics/Typograph";
import { MigrationInviteContent } from "./MigrationInviteContent";
import { submitSamlForm } from "./loginUtils";
import MigrationActions from "./MigrationActions";

/**
 * The optional invitation to link a CMD/eIDAS identity to an account that
 * signs in with a password (LEDG-2517).
 *
 * 🚨 WHETHER IT SHOWS IS THE BACKEND'S ANSWER, per account, read from /me
 * through AuthContext. Nothing here reads configuration, and nothing here
 * re-derives the condition: that is the regression LEDG-2432 was, where the
 * frontend assumed a migration flag and removed the sign-in form from
 * production. The guard that keeps it that way reads this file's source
 * (migration-flag-guard.test.ts), because nothing observable in a rendered
 * page distinguishes "the backend told us" from "we guessed".
 *
 * It lives in src/components/login/ for that reason and not by accident --
 * that directory is what the guard reads.
 *
 * Optional in the strong sense: dismissing costs nothing, does not sign
 * anybody out, and is not a refusal. The backend stores a DATE, so the invite
 * returns after a month, and the way back stays open to somebody who
 * dismissed it and changed their mind.
 */
/**
 * Every page about signing in, and none of them is a place to be invited to
 * link an account.
 *
 * 🚩 Two different ways it reads wrong, and both were seen on screen:
 *
 *  - on the flow's own pages (migrate-account, complete-registration) it
 *    invites somebody to start what they are in the middle of, which reads as
 *    "the first step did not work" -- and its buttons restart the flow from
 *    scratch, throwing away what they have already done;
 *  - on /login after a refusal it contradicts the refusal outright: "Associe a
 *    sua conta" directly above "Não foi possível associar", with buttons that
 *    would repeat the same doomed round-trip. The notice appears there at all
 *    because the remember-me cookie keeps /me answering after the refusal
 *    logged the session out.
 *
 * Matched by path segment so neither a locale prefix nor a sub-route slips
 * past.
 */
const FLOW_ROUTES = [
  "migrate-account",
  "complete-registration",
  "login",
  "loginregister",
  "register",
  "reset-password",
];

const HIDDEN_KEY = "migrationInviteHiddenForVisit";

/** Every access is guarded: a browser may refuse storage outright, and the
 *  server has none at all. Failing towards VISIBLE is the safe direction --
 *  somebody sees a reminder they had closed, rather than never seeing one. */
function readHiddenForThisVisit(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(HIDDEN_KEY) === "1";
  } catch {
    return false;
  }
}

function hideForThisVisit(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(HIDDEN_KEY, "1");
  } catch {
    // The banner is already hidden by local state for this render; losing the
    // memory only means it returns on the next page, which is harmless.
  }
}

export function MigrationInvite() {
  const { t } = useTranslation("login");
  const routerNav = useRouter();
  const { migrationInvite, migrationLinkAvailable, isLoading: authLoading } = useAuth();
  const pathname = usePathname();
  // Hidden for THIS visit, and nowhere else. Read through a window guard
  // because a "use client" component is still rendered on the server, where
  // the hooks run and sessionStorage does not exist -- without it this file
  // takes the whole page down. Same shape HarvestersNewClient already uses.
  //
  // No hydration risk despite reading during render: AuthContext starts with
  // isLoading true, so the banner never reaches its output on the server.
  const [dismissed, setDismissed] = useState(() => readHiddenForThisVisit());

  // isLoading is in the condition for hydration, not for looks: /me is fetched
  // in the browser, so the server renders nothing and a client that answered
  // before React hydrated would render the notice into HTML that never had it.
  const onFlowPage = (pathname ?? "").split("/").some((segment) => FLOW_ROUTES.includes(segment));

  // 🚩 The reminder stays at home. The full screen reaches the citizen every
  // eight days wherever they are, and it is the one carrying the whole
  // invitation; repeating a banner above every page in between is how a notice
  // becomes wallpaper.
  //
  // The cost is named rather than hidden: somebody who follows a link straight
  // to a dataset does not see it that visit. That is the trade, and the full
  // screen is what makes it affordable.
  //
  // The homepage is the locale segment and nothing else -- "/pt", "/en" -- so
  // it is counted rather than matched, and a new locale needs no change here.
  const onHomepage = (pathname ?? "/").split("/").filter(Boolean).length <= 1;

  // 🚩 NOTHING IS SENT TO THE SERVER, and that is the decision this ticket
  // carries. The date in extras belongs to the full screen alone: it is what
  // buys the eight days of quiet. If the banner wrote it too, closing the
  // banner every day would push the full screen out for ever -- and the full
  // screen is the one that carries the whole invitation.
  //
  // So the banner hides for the visit and the count keeps running underneath.
  const handleDismiss = (goTo?: string) => {
    setDismissed(true);
    hideForThisVisit();
    if (goTo) routerNav.push(goTo);
  };

  // 🚩 The three states are disjoint, and this is the line that makes them so.
  // `migrationInvite` is the LOUD state -- never dismissed, or dismissed eight
  // days ago or more -- and MigrationInviteGate owns it, showing the invite in
  // place of the page. The banner is the quiet state in between: the account
  // can still link, and has dismissed recently.
  //
  // Reading `migrationInvite` here, as this did before the full screen existed,
  // would put both on screen at once.
  const inQuietState = migrationLinkAvailable && !migrationInvite;

  if (authLoading || onFlowPage || !onHomepage || !inQuietState || dismissed) return null;

  return (
    <CardExpandable
      variant={"secondary-100"}
      showBookmarkIcon={false}
      hasIcon
      leadingIcon="agora-line-social-security"
      leadingIconHover="agora-line-social-security"
      cardHeadingLevel={"h3"}
      cardTitle={t("MigrationInviteSection.title")}
      cardSubtitle={
        <Trans t={t} i18nKey="MigrationInviteSection.shortDescription" components={{ b: <b /> }} />
      }
      accordionHeadingTitle={t("migrationInvite.bannerMore")}
    >
      <div className="flex flex-col gap-32">
        <Typograph
          tag="p"
          className="max-w-[592px] text-m-regular whitespace-pre-line text-primary-900"
        >
          <Trans t={t} i18nKey="MigrationInviteSection.longDescription" components={{ b: <b /> }} />
        </Typograph>

        <MigrationActions onDismiss={handleDismiss} isInsideCard />
      </div>
    </CardExpandable>
  );
}
