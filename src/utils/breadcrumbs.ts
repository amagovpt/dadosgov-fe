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
