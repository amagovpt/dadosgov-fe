"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type UrlScalar = string | number | null | undefined;
type UrlValue = UrlScalar | UrlScalar[];
type UrlOverrides = Record<string, UrlValue>;

interface BuildUrlOptions {
  includeCurrentPage?: boolean;
}

interface ReplaceUrlOptions extends BuildUrlOptions {
  scroll?: boolean;
}

function applyParam(params: URLSearchParams, key: string, value: UrlValue): void {
  params.delete(key);

  if (Array.isArray(value)) {
    value.forEach((entry) => {
      if (entry === null || entry === undefined || entry === "") return;
      params.append(key, String(entry));
    });
    return;
  }

  if (value === null || value === undefined || value === "") return;
  params.set(key, String(value));
}

export function useListingUrlState(defaultPage = 1) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activePage = Number(searchParams.get("page") || String(defaultPage || 1));

  const getLiveParams = useCallback(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams(Array.from(searchParams.entries()));
  }, [searchParams]);

  const buildUrl = useCallback(
    (overrides: UrlOverrides = {}, options: BuildUrlOptions = {}) => {
      const params = getLiveParams();
      const includeCurrentPage = options.includeCurrentPage ?? true;
      const hasPageOverride = Object.prototype.hasOwnProperty.call(overrides, "page");

      Object.entries(overrides).forEach(([key, value]) => {
        if (key === "page") return;
        applyParam(params, key, value);
      });

      if (hasPageOverride) {
        const raw = overrides.page;
        const page =
          Array.isArray(raw) || raw === null || raw === undefined || raw === ""
            ? 1
            : Number(raw);
        if (Number.isFinite(page) && page > 1) params.set("page", String(page));
        else params.delete("page");
      } else if (includeCurrentPage && activePage > 1) {
        params.set("page", String(activePage));
      } else {
        params.delete("page");
      }

      params.sort();
      const qs = params.toString();
      return `${pathname}${qs ? `?${qs}` : ""}`;
    },
    [activePage, getLiveParams, pathname]
  );

  const replaceWith = useCallback(
    (overrides: UrlOverrides = {}, options: ReplaceUrlOptions = {}) => {
      const next = buildUrl(overrides, options);
      router.replace(next, { scroll: options.scroll ?? false });
    },
    [buildUrl, router]
  );

  return { buildUrl, replaceWith, activePage };
}
