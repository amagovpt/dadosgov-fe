import { ReactNode, Suspense } from "react";
import { HeaderWrapper } from "@/components/HeaderWrapper";
import NewAccountNotice from "@/components/login/NewAccountNotice";
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
      </Suspense>
      <Suspense fallback={null}>
        <ConfirmEmailNotice />
      </Suspense>
      <Suspense fallback={null}>
        <CompleteRegistrationGate />
      </Suspense>
      <div className="">{children}</div>
    </div>
  );
}
