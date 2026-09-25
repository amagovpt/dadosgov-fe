"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import type { AdminSideNavigationData } from "@/service/types/admin-side-navigation";
import { getAdminNavItems } from "@/utils/adminNavItems";
import { localizeHref } from "@/utils/localizeHref";
import { splitLocale } from "@/utils/stripLocale";

const FALLBACK_HREF = "/admin/me/datasets";

/**
 * `/admin` has no content of its own: it opens the first side-navigation entry of
 * the active profile. `AdminOrgRedirect` falls back here when there is no active org.
 */
export function AdminHomeRedirect({ navigation }: { navigation: AdminSideNavigationData }) {
  const router = useRouter();
  const { locale } = splitLocale(usePathname());
  const { activeProfile, isLoading } = useActiveProfile();

  useEffect(() => {
    if (isLoading) return;
    const [first] = getAdminNavItems(navigation, activeProfile);
    router.replace(localizeHref(first?.href || FALLBACK_HREF, locale));
  }, [activeProfile, isLoading, locale, navigation, router]);

  return null;
}
