import type { AdminNavLink, AdminSideNavigationData } from "@/service/types/admin-side-navigation";
import type { ActiveProfile } from "@/context/ActiveProfileContext";

export interface AdminNavItem {
  label: string;
  href: string;
  icon?: string;
  customIcon?: string;
}

function toNavItem(link: AdminNavLink): AdminNavItem {
  return {
    label: link.label,
    href: link.href,
    icon: link.icon ?? undefined,
    customIcon: link.logo ?? undefined,
  };
}

export function getAdminNavItems(
  data: AdminSideNavigationData | undefined,
  profile: ActiveProfile
): AdminNavItem[] {
  if (profile.type === "organization") {
    const orgBase = `/admin/org/${profile.orgId}`;
    return (data?.orgChildren ?? [])
      .filter((child) => child.enabled !== false)
      .map((child) => toNavItem({ ...child, href: `${orgBase}/${child.href.replace(/^\/+/, "")}` }));
  }

  if (profile.type === "system") {
    const systemGroup = (data?.groups ?? []).find(
      (group) => group.enabled !== false && group.key === "system"
    );
    return (systemGroup?.children ?? [])
      .filter((child) => child.enabled !== false)
      .map(toNavItem);
  }

  const profileGroup = (data?.groups ?? []).find(
    (group) => group.enabled !== false && group.key !== "organization" && group.key !== "system"
  );
  return (profileGroup?.children ?? []).filter((child) => child.enabled !== false).map(toNavItem);
}
