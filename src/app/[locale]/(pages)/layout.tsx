import { ReactNode, Suspense } from "react";
import { HeaderWrapper } from "@/components/HeaderWrapper";
import NewAccountNotice from "@/components/login/NewAccountNotice";
import { MigrationInvite } from "@/components/login/MigrationInvite";
import { MigrationInviteGate } from "@/components/login/MigrationInviteGate";
import ConfirmEmailNotice from "@/components/login/ConfirmEmailNotice";
import CompleteRegistrationGate from "@/components/login/CompleteRegistrationGate";
import { loadShellData } from "@/service/commom/shell";
import { i18nConfig } from "@/config/i18nConfig";

export default async function PagesLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = i18nConfig.locales.includes(rawLocale) ? rawLocale : i18nConfig.defaultLocale;

  // Throws when both halves of the shell are unavailable, which sends the
  // request to `app/global-error.tsx` rather than serving an empty frame.
  const { headerNavigation } = await loadShellData(locale);

  return (
    <div className="flex w-full flex-col">
      <HeaderWrapper data={headerNavigation} />
      <Suspense fallback={null}>
        <NewAccountNotice />
        <MigrationInvite />
      </Suspense>
      <Suspense fallback={null}>
        <ConfirmEmailNotice />
      </Suspense>
      <Suspense fallback={null}>
        <CompleteRegistrationGate />
      </Suspense>
      {/* Wraps the page rather than redirecting: see the component for the five
          ways a redirect traps somebody. Inside the Suspense boundaries above
          it would not cover the page itself, which is the whole point. */}
      <MigrationInviteGate>
        <div className="">{children}</div>
      </MigrationInviteGate>
    </div>
  );
}
