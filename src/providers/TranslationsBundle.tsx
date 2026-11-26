"use client";

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { Resource } from "i18next";

export function TranslationsBundle({
  locale,
  resources,
  children,
}: {
  locale: string;
  resources: Resource;
  children: ReactNode;
}) {
  const { i18n } = useTranslation();

  for (const [ns, bundle] of Object.entries(resources[locale] ?? {})) {
    if (!i18n.hasResourceBundle(locale, ns)) {
      i18n.addResourceBundle(locale, ns, bundle, true, true);
    }
  }

  return children;
}
