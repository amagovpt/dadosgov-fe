import type { ReactNode } from "react";
import initTranslations from "@/app/i18n";
import { i18nConfig } from "@/config/i18nConfig";
import { TranslationsBundle } from "@/providers/TranslationsBundle";


export async function RouteTranslations({
  params,
  namespaces,
  children,
}: {
  params: Promise<{ locale: string }>;
  namespaces: string[];
  children: ReactNode;
}) {
  const { locale: rawLocale } = await params;
  const locale = i18nConfig.locales.includes(rawLocale) ? rawLocale : i18nConfig.defaultLocale;
  const { resources } = await initTranslations({ locale, namespaces });

  return (
    <TranslationsBundle locale={locale} resources={resources}>
      {children}
    </TranslationsBundle>
  );
}
