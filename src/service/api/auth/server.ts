import "server-only";

import { cache } from "react";
import { backendFetch } from "@/app/backend-fetch";
import { serverAuthHeaders } from "@/service/utils/serverForwardedHeaders";
import { rethrowControlFlow } from "@/service/utils/rethrowControlFlow";
import type { InitialSession } from "@/service/types/identity/session";

// Request-scoped: layout and page share this lookup, never another visitor's session.
export const getInitialSession = cache(async (): Promise<InitialSession> => {
  const headers = await serverAuthHeaders();
  if (!/(?:^|;\s*)(?:session|remember_token)=[^;]/.test(headers.Cookie ?? "")) {
    return { user: null, renewCookie: false };
  }
  try {
    const response = await backendFetch("/api/1/me/", {
      headers: { ...headers, Accept: "application/json" },
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    return {
      user: response.ok ? await response.json() : null,
      // RSC rendering cannot write cookies. Preserve the existing /auth/me
      // cookie relay when Flask renews a session or restores remember-me login.
      renewCookie: response.headers.getSetCookie().length > 0,
    };
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error loading initial session:", error);
    return { user: null, renewCookie: false };
  }
});
