"use client";

import { useToastContext } from "@ama-pt/agora-design-system";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/context/AuthContext";
import {
  NETWORK_FAILURE,
  resolveApiErrorAction,
  shouldRollbackNavigation,
  type ApiFailure,
} from "@/service/utils/apiErrorPolicy";
import { installFetchErrorInterceptor } from "@/service/utils/installFetchErrorInterceptor";
import { normalizeApiError } from "@/service/utils/normalizeApiError";
import { buildLoginHref } from "@/utils/buildLoginHref";
import { stripLocale } from "@/utils/stripLocale";

const DEDUPE_WINDOW_MS = 5000;
const TOAST_DURATION_MS = 10000;

interface ApiErrorContextValue {
  notifyApiError: (error: unknown, fallbackMessage?: string) => void;
  /**
   * Whether the error boundary should undo the navigation that reached it
   * rather than render the error page. Read-only, so the boundary can decide
   * what to paint on its very first render.
   *
   * Internal: consumers go through `useNavigationRollback()`.
   */
  canRollbackNavigation: () => boolean;
  /**
   * Undo that navigation: report it and go back. Self-guarding, so calling it
   * twice does it once. Internal: see `useNavigationRollback()`.
   */
  rollbackFailedNavigation: () => void;
}

const ApiErrorContext = createContext<ApiErrorContextValue>({
  notifyApiError: () => {},
  canRollbackNavigation: () => false,
  rollbackFailedNavigation: () => {},
});

export function ApiErrorProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation("common");
  const { showToast } = useToastContext();
  const { refresh } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const lastFailure = useRef<{ key: string; at: number } | null>(null);
  // Read inside callbacks that must not be re-created when the route changes,
  // otherwise the fetch patch would be torn down and re-installed on every
  // navigation, racing with any request in flight.
  const pathnameRef = useRef(pathname);
  // How many client-side navigations this mount has seen, and when we last
  // undid one. The provider sits in the root layout, so it survives the
  // navigation that fails and these refs are still here when the error
  // boundary below it asks whether to roll back.
  const softNavigations = useRef(0);
  const lastRollbackAt = useRef<number | null>(null);
  useEffect(() => {
    // The first run is the initial render, not a navigation. Counting it would
    // make a cold load on a broken URL look like something we could go back
    // from, and `router.back()` would leave the portal.
    if (pathnameRef.current !== pathname) softNavigations.current += 1;
    pathnameRef.current = pathname;
  }, [pathname]);

  const toast = useCallback(
    (title: string, description: string) => {
      showToast(
        {
          id: crypto.randomUUID(),
          type: "failure",
          title,
          description,
          closeLabel: t("header.close"),
        },
        TOAST_DURATION_MS
      );
    },
    [showToast, t]
  );

  const redirectToLogin = useCallback(() => {
    const current = pathnameRef.current;
    if (current && stripLocale(current).startsWith("/login")) return;

    // Drop the now-stale user so the header stops showing a logged-in state.
    refresh();
    toast(t("apiError.sessionExpiredTitle"), t("apiError.sessionExpiredDescription"));
    router.push(buildLoginHref(current));
  }, [refresh, router, t, toast]);

  /**
   * A page that fires several requests against a downed backend should produce
   * one toast, not one per request. Shared by every report so a failed
   * navigation, the interceptor and a call site's own `notifyApiError` for the
   * same failure also collapse into one.
   */
  const isRepeat = useCallback((key: string) => {
    const now = Date.now();
    if (lastFailure.current?.key === key && now - lastFailure.current.at < DEDUPE_WINDOW_MS) {
      return true;
    }
    lastFailure.current = { key, at: now };
    return false;
  }, []);

  /** Apply the policy to a raw status, de-duplicating repeat reports. */
  const handleFailure = useCallback(
    (status: ApiFailure) => {
      const action = resolveApiErrorAction(status, "client");
      if (action === "ignore") return;

      if (action === "redirect-login") {
        if (isRepeat(`redirect-login:${status}`)) return;
        redirectToLogin();
        return;
      }

      if (isRepeat(`toast:${status}`)) return;

      if (status === NETWORK_FAILURE) {
        toast(t("apiError.networkErrorTitle"), t("apiError.networkErrorDescription"));
        return;
      }

      toast(t("apiError.serverErrorTitle"), t("apiError.serverErrorDescription"));
    },
    [isRepeat, redirectToLogin, t, toast]
  );

  useEffect(
    () =>
      installFetchErrorInterceptor({
        scope: window,
        // Unlike the server half, reporting here must never be the reason a
        // request fails: the caller still has a page, and its own `catch` is
        // what decides what to do with the response.
        onFailure: (status) => safely(() => handleFailure(status)),
      }),
    [handleFailure]
  );

  const notifyApiError = useCallback(
    (error: unknown, fallbackMessage?: string) => {
      const normalized = normalizeApiError(
        error,
        fallbackMessage ?? t("apiError.serverErrorDescription")
      );

      if (normalized.status === 401) {
        redirectToLogin();
        return;
      }

      // The interceptor has already toasted a 5xx generically by the time the
      // call site's `catch` gets here; without this the visitor sees two.
      // A 4xx is `ignore`d by the policy, so the specific backend message this
      // raises — a validation error, above all — still gets through.
      if (normalized.status && isRepeat(`toast:${normalized.status}`)) return;

      toast(t("apiError.serverErrorTitle"), normalized.message);
    },
    [isRepeat, redirectToLogin, t, toast]
  );

  /** "That page could not be opened — you are still on the previous one." */
  const notifyNavigationError = useCallback(() => {
    if (isRepeat("navigation")) return;
    toast(t("apiError.navigationErrorTitle"), t("apiError.navigationErrorDescription"));
  }, [isRepeat, t, toast]);

  const canRollbackNavigation = useCallback(
    () =>
      shouldRollbackNavigation({
        softNavigations: softNavigations.current,
        lastRollbackAt: lastRollbackAt.current,
        now: Date.now(),
      }),
    []
  );

  const rollbackFailedNavigation = useCallback(() => {
    if (!canRollbackNavigation()) return;

    lastRollbackAt.current = Date.now();
    notifyNavigationError();
    router.back();
  }, [canRollbackNavigation, notifyNavigationError, router]);

  const value = useMemo(
    () => ({ notifyApiError, canRollbackNavigation, rollbackFailedNavigation }),
    [notifyApiError, canRollbackNavigation, rollbackFailedNavigation]
  );

  return <ApiErrorContext.Provider value={value}>{children}</ApiErrorContext.Provider>;
}

export const useApiErrorHandler = () => useContext(ApiErrorContext);

export function useNavigationRollback(allowed = true): boolean {
  const { canRollbackNavigation, rollbackFailedNavigation } = useContext(ApiErrorContext);
  const [rollingBack] = useState(() => allowed && canRollbackNavigation());

  useEffect(() => {
    if (rollingBack) rollbackFailedNavigation();
  }, [rollingBack, rollbackFailedNavigation]);

  return rollingBack;
}

/** The interceptor must never be the reason a request fails. */
function safely(run: () => void): void {
  try {
    run();
  } catch (error) {
    console.error("[api-error] handler failed", error);
  }
}
