"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { backendFetch } from "@/app/backend-fetch";
import { getInitialSession } from "@/service/api/auth/server";
import { serverAuthHeaders } from "@/service/utils/serverForwardedHeaders";
import { rethrowControlFlow } from "@/service/utils/rethrowControlFlow";
import type { FavoriteActionState } from "@/service/types/dataservice/detail";

export async function setDataserviceFavorite(
  id: string,
  locale: string,
  previous: FavoriteActionState,
  form: FormData,
): Promise<FavoriteActionState> {
  const failed = { favorite: previous?.favorite === true, failed: true };
  if (!(form instanceof FormData)) return failed;
  const desired = form.get("favorite");
  if (!/^[a-f\d]{24}$/i.test(id) || !["pt", "en"].includes(locale) ||
    (desired !== "true" && desired !== "false")) return failed;

  // Every invocation checks the current session. Neither the rendered button
  // nor submitted form data grants access; the backend also enforces ownership.
  const { user } = await getInitialSession();
  if (!user) redirect(`/${locale}/login`);

  try {
    const forwarded = await serverAuthHeaders();
    const host = forwarded["X-Forwarded-Host"];
    const proto = forwarded["X-Forwarded-Proto"];
    const response = await backendFetch(`/api/1/dataservices/${id}/followers/`, {
      method: desired === "true" ? "POST" : "DELETE",
      headers: {
        ...forwarded,
        ...(host && proto ? { Referer: `${proto}://${host}/` } : {}),
      },
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });

    // Preserve the session-cookie relay previously provided by the API proxy.
    // NextResponse parses cookie attributes; domain is scoped to this frontend.
    const renewedCookies = new NextResponse(null, { headers: response.headers }).cookies.getAll();
    if (renewedCookies.length) {
      const store = await cookies();
      for (const cookie of renewedCookies) {
        const scopedCookie = { ...cookie };
        delete scopedCookie.domain;
        store.set(scopedCookie);
      }
    }
    if (response.status === 401) redirect(`/${locale}/login`);
    if (!response.ok) return failed;
    return { favorite: desired === "true", failed: false };
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error updating dataservice favourite:", error);
    return failed;
  }
}
