"use client";

import { useCallback } from "react";
import { useParams } from "next/navigation";
import { i18nConfig } from "@/config/i18nConfig";
import { localizeHref } from "@/utils/localizeHref";

/**
 * Active URL locale (`pt` | `en`) from the `[locale]` route segment, falling
 * back to the default locale when rendered outside the localized tree.
 */
export function useCurrentLocale(): string {
  const params = useParams<{ locale?: string }>();
  const locale = typeof params?.locale === "string" ? params.locale : "";
  return (i18nConfig.locales as readonly string[]).includes(locale)
    ? locale
    : i18nConfig.defaultLocale;
}

/**
 * Memoized `localizeHref` bound to the active locale. Use it for `router.push`
 * targets and href props that can't be rendered through `<LocalizedLink>`
 * (e.g. design-system `anchor`/`mainAnchor` props).
 */
export function useLocalizedHref(): (href: string) => string {
  const locale = useCurrentLocale();
  return useCallback((href: string) => localizeHref(href, locale), [locale]);
}
