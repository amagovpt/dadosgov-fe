"use client";
import { I18nextProvider } from "react-i18next";
import initTranslations from "@/app/i18n";
import { createInstance, Resource } from "i18next";

export default function TranslationsProvider({
  children,
  locale,
  namespaces,
  resources,
}: {
  children: React.ReactNode;
  locale: string;
  namespaces: string[];
  resources: Resource;
}) {
  const i18nInstance = createInstance();

  initTranslations({ locale, namespaces, i18nInstance, resources });

  return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>;
}
