"use client";

import { useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { stripLocale } from "@/utils/stripLocale";

const ADMIN_DEFAULT_ROUTE = "/admin/me/datasets";
const LOGIN_ROUTE = "/login";

export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAdmin, hasOrganization } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  // usePathname() is locale-prefixed (`/pt/admin/...`); normalize before
  // matching so the guards fire regardless of the active locale.
  const localePath = useMemo(() => stripLocale(pathname), [pathname]);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace(LOGIN_ROUTE);
      return;
    }

    if (localePath.startsWith("/admin/system") && !isAdmin) {
      router.replace(ADMIN_DEFAULT_ROUTE);
      return;
    }

    if (
      localePath.startsWith("/admin/org") &&
      !localePath.startsWith("/admin/organizations/new") &&
      !hasOrganization
    ) {
      router.replace(ADMIN_DEFAULT_ROUTE);
      return;
    }
  }, [user, isLoading, isAdmin, hasOrganization, localePath, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-neutral-600">A carregar...</p>
      </div>
    );
  }

  if (!user) return null;

  if (localePath.startsWith("/admin/system") && !isAdmin) return null;

  if (
    localePath.startsWith("/admin/org") &&
    !localePath.startsWith("/admin/organizations/new") &&
    !hasOrganization
  )
    return null;

  return <>{children}</>;
}
