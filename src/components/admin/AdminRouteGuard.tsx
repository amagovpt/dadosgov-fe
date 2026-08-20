"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSideNavigation } from "@/components/admin/AdminSideNavigation";
import { ErrorState } from "@/components/Shared/ErrorState";
import { useAuth } from "@/context/AuthContext";
import type { AdminSideNavigationData } from "@/service/types/admin-side-navigation";
import { stripLocale } from "@/utils/stripLocale";

/** The refusal a route answers with, or `null` when it may be entered. */
type Refusal = 401 | 403 | null;

/**
 * Who may see a backoffice route, and — because the answer decides which frame
 * the page gets — the frame itself.
 *
 * Every check here answers with the page the API policy would have raised for
 * the same refusal — 401 when there is no session, 403 when the session lacks
 * the permission — rather than a redirect. The redirects it replaced said
 * nothing: an anonymous visitor was bounced to `/login` without a `?next=`, so
 * signing in dropped them on the homepage instead of the page they asked for,
 * and a non-admin was moved to their own datasets with no indication that
 * anything had been refused, which reads as the portal losing the click.
 *
 * The backoffice needs its own checks at all because its pages fetch their
 * authenticated data client-side (the server halves read only the CMS, which is
 * outside the policy's watched prefixes), so no 401 ever reaches a boundary
 * here. The role and organization rules have no HTTP status behind them either
 * — they are refused before a request is made.
 *
 * Owning the frame is what keeps a refusal from being furnished with the room it
 * was refused: the backoffice topbar and side navigation. A refusal renders the
 * error page and nothing else, and the portal's own header comes back on its own
 * — the root layout always renders it, and `globals.css` hides it through
 * `body:has(.admin-wrapper) > div > header.sticky`, a rule that stops matching
 * the moment this component leaves the wrapper out. Action at a distance, hence
 * the note. The public footer needs no help: it was never hidden.
 *
 * While the session is still resolving the frame stays, with the placeholder
 * inside it. `useAuth` is loading on every single page load, so swapping frames
 * for that window would flash the portal header onto every backoffice visit —
 * and `children` must stay unmounted until we know, so an admin page never
 * fetches on behalf of someone who turns out to be refused.
 */
export function AdminRouteGuard({
  navigation,
  children,
}: {
  navigation: AdminSideNavigationData;
  children: React.ReactNode;
}) {
  const { t } = useTranslation("admin-common");
  const { user, isLoading, isAdmin, hasOrganization } = useAuth();
  const pathname = usePathname();
  // usePathname() is locale-prefixed (`/pt/admin/...`); normalize before
  // matching so the guards fire regardless of the active locale.
  const localePath = useMemo(() => stripLocale(pathname), [pathname]);

  const refusal: Refusal = useMemo(() => {
    if (isLoading) return null;
    // Not signed in at all.
    if (!user) return 401;
    if (localePath.startsWith("/admin/system") && !isAdmin) return 403;
    if (
      localePath.startsWith("/admin/org") &&
      !localePath.startsWith("/admin/organizations/new") &&
      !hasOrganization
    ) {
      return 403;
    }
    return null;
  }, [hasOrganization, isAdmin, isLoading, localePath, user]);

  if (refusal) return <ErrorState status={refusal} />;

  return (
    <div className="admin-wrapper">
      <AdminHeader />
      <div className="admin-layout">
        <AdminSideNavigation data={navigation} />
        <div className="admin-layout__content">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <p className="text-neutral-600">{t("loading")}</p>
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}
