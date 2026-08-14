"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useLocalizedHref } from "@/hooks/useLocalizedHref";

type LocalizedLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  /** Internal href without locale prefix (`/datasets`); localized on render. */
  href: string;
};

/**
 * Drop-in replacement for `next/link` on internal navigation: prefixes the
 * href with the active locale before it reaches the Next router.
 *
 * With `prefixDefault: true`, an unprefixed href 307s through the i18n proxy
 * on every prefetch with `no-store`, which the router retries indefinitely —
 * the homepage request loop. See `src/utils/localizeHref.ts`.
 */
export function LocalizedLink({ href, ...props }: LocalizedLinkProps) {
  const localize = useLocalizedHref();
  return <Link {...props} href={localize(href)} />;
}
