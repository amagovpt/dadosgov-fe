import type { ReactNode } from "react";
import { stripLocale } from "@/utils/stripLocale";

export const PAGELESS_BREADCRUMB_PATHS: string[] = [
  "/recursos",
  "/recursos/como-usar-o-portal",
  "/recursos/desenvolvimento",
];

function stripQueryAndHash(path: string): string {
  const withoutHash = path.split("#")[0];
  return withoutHash.split("?")[0];
}

function normalizeBreadcrumbPath(url: string): string {
  const stripped = stripLocale(stripQueryAndHash(url));
  if (stripped === "/") return "/";
  return stripped.replace(/\/+$/, "") || "/";
}

function isExternalOrEmptyUrl(url: string): boolean {
  if (!url) return true;
  return /^([a-z][a-z0-9+.-]*:)|^#/i.test(url);
}

export function isPagelessBreadcrumbPath(
  url: string,
  pagelessPaths: string[] = PAGELESS_BREADCRUMB_PATHS
): boolean {
  return pagelessPaths.includes(normalizeBreadcrumbPath(url));
}

export function sanitizeBreadcrumbItems<T extends { url: string }>(
  items: T[],
  pagelessPaths: string[] = PAGELESS_BREADCRUMB_PATHS
): T[] {
  return items.map((item) => {
    if (isExternalOrEmptyUrl(item.url)) return item;
    if (isPagelessBreadcrumbPath(item.url, pagelessPaths)) return { ...item, url: "" };
    return item;
  });
}

export type DynamicBreadcrumbItem = {
  label: ReactNode;
  url: string;
};

/**
 * Turns a raw route segment into a human-readable label as a last-resort
 * fallback when there is no i18n key for it: URL-decodes, swaps `-`/`_` for
 * spaces and capitalizes each word (`"areas-tematicas"` → `"Áreas Tematicas"`).
 */
export function prettifySegment(segment: string): string {
  let decoded = segment;
  try {
    decoded = decodeURIComponent(segment);
  } catch {
    // Malformed percent-encoding — keep the raw segment.
  }
  return decoded
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
}

/**
 * Builds breadcrumb items from a route path. Pure (no React/hooks) so it can be
 * reused by the `BreadcrumbDynamic` client component and unit-tested in isolation.
 *
 * - Strips the leading locale segment via {@link stripLocale}.
 * - Resolves each segment's label through `t(segment, { defaultValue })`, using
 *   {@link prettifySegment} as the fallback, unless an entry in `overrides`
 *   (keyed by the raw segment) provides a label (e.g. a dataset id → its title).
 * - The last item gets an empty `url` (current page, not a link); intermediate
 *   "pageless" paths are blanked later by `sanitizeBreadcrumbItems` in the
 *   `Breadcrumb` primitive.
 */
export function buildBreadcrumbItems({
  path,
  t,
  overrides,
  includeHome = true,
}: {
  path: string;
  t: (key: string, options?: { defaultValue?: string }) => string;
  overrides?: Record<string, ReactNode>;
  includeHome?: boolean;
}): DynamicBreadcrumbItem[] {
  const segments = stripLocale(path).split("/").filter(Boolean);

  const items: DynamicBreadcrumbItem[] = segments.map((segment, index) => {
    const url = "/" + segments.slice(0, index + 1).join("/");
    const isLast = index === segments.length - 1;
    const label =
      overrides?.[segment] ?? t(segment, { defaultValue: prettifySegment(segment) });
    return { label, url: isLast ? "" : url };
  });

  if (!includeHome) return items;

  return [{ label: t("home", { defaultValue: "Início" }), url: "/" }, ...items];
}
