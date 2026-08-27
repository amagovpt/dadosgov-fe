"use client";
import "./[locale]/globals.css";
import { notoSans, notoSansMono } from "./fonts";

import Icon from "@/components/Primitives/Icon";
import { ErrorHelpCard } from "@/components/Shared/ErrorState/ErrorHelpCard";
import TranslationsProvider from "@/providers/TranslationProvider";
import { splitLocale } from "@/utils/stripLocale";
import { usePathname } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { Resource } from "i18next";
import ptCommon from "@/locales/pt/common.json";
import enCommon from "@/locales/en/common.json";
import Link from "next/link";
import Image from "next/image";

const resources: Resource = {
  pt: { common: ptCommon },
  en: { common: enCommon },
};


function MaintenanceNotice() {
  const { t } = useTranslation("common");

  return (
    <main className="flex min-h-[calc(100vh-75px)] w-full flex-col gap-32 bg-primary-900 py-64">
      <div className="container mx-auto flex flex-col md:items-start items-center gap-32 md:flex-row">
        <Suspense fallback={null}>
          <Icon
            name="agora-line-hardware-settings"
            aria-hidden
            focusable={false}
            className="!h-[280px] !min-h-[280px] !w-[280px] !min-w-[280px] shrink-0 !fill-white"
          />
        </Suspense>
        <div className="flex flex-col gap-32">
          <h1 className="!text-2xl-bold md:!text-3xl-bold !text-white">
            {t("errorMaintenance.title")}
          </h1>
          <div className="flex w-full flex-col gap-16">
            <span className="!text-m-bold !text-white">{t("errorMaintenance.subtitle")}</span>
            <span className="!text-m-regular !text-white max-w-xl">
              {t("errorMaintenance.description")}
            </span>
          </div>
        </div>
      </div>
      <ErrorHelpCard global className="h-[140px]" />
    </main>
  );
}

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  const { locale } = splitLocale(usePathname());

  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang={locale}>
      <body className={`${notoSans.variable} ${notoSansMono.variable} antialiased`}>
        <TranslationsProvider locale={locale} namespaces={["common"]} resources={resources}>
          <div className="flex w-full justify-center bg-white">
            <nav className="container flex py-16">
              <Link href={`/${locale}`}>
                <Image
                  src="/Logos/logo-dados-gov.svg"
                  alt="dados.gov.pt"
                  width={254}
                  height={43}
                />
              </Link>
            </nav>
          </div>
          <MaintenanceNotice />
        </TranslationsProvider>
      </body>
    </html>
  );
}
