"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";

const ADMIN_DEFAULT_ROUTE = "/admin/me/datasets";
const LOGIN_ROUTE = "/login";

export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation("admin-common");
  const { user, isLoading, isAdmin, hasOrganization } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace(LOGIN_ROUTE);
      return;
    }

    if (pathname?.startsWith("/admin/system") && !isAdmin) {
      router.replace(ADMIN_DEFAULT_ROUTE);
      return;
    }

    if (
      pathname?.startsWith("/admin/org") &&
      !pathname?.startsWith("/admin/organizations/new") &&
      !hasOrganization
    ) {
      router.replace(ADMIN_DEFAULT_ROUTE);
      return;
    }
  }, [user, isLoading, isAdmin, hasOrganization, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-neutral-600">{t("loading")}</p>
      </div>
    );
  }

  if (!user) return null;

  if (pathname?.startsWith("/admin/system") && !isAdmin) return null;

  if (
    pathname?.startsWith("/admin/org") &&
    !pathname?.startsWith("/admin/organizations/new") &&
    !hasOrganization
  )
    return null;

  return <>{children}</>;
}
