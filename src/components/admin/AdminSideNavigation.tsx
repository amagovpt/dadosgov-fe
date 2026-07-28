"use client";

import React, { useMemo, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar, SidebarItem, Icon } from "@ama-pt/agora-design-system";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { fetchOrganization } from "@/service/api/organizations";
import { Organization } from "@/service/types/identity";
import type {
  AdminNavLink,
  AdminSideNavigationData,
} from "@/service/types/admin-side-navigation";
import { stripLocale } from "@/utils/stripLocale";

interface NavChild {
  label: string;
  href: string;
  icon?: string;
  customIcon?: string;
}

interface NavGroup {
  key: string;
  label: string;
  icon?: string;
  children: NavChild[];
}

function toSentenceCase(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function toNavChild(link: AdminNavLink, href: string): NavChild {
  return {
    label: link.label,
    href,
    icon: link.icon ?? undefined,
    customIcon: link.logo ?? undefined,
  };
}

export function AdminSideNavigation({ data }: { data: AdminSideNavigationData }) {
  const pathname = usePathname();
  // usePathname() is locale-prefixed (`/pt/admin/...`) because prefixDefault is
  // true; normalize before matching so `/admin`-anchored logic keeps working.
  const localePath = useMemo(() => stripLocale(pathname), [pathname]);
  const { isAdmin } = useAuth();
  const { organizations } = useActiveOrganization();
  const [urlOrg, setUrlOrg] = useState<Organization | null>(null);

  // Extract orgId from URL like /admin/org/{orgId}/...
  const urlOrgId = useMemo(() => {
    const match = localePath.match(/^\/admin\/org\/([^/]+)/);
    return match ? match[1] : null;
  }, [localePath]);

  // Fetch org from URL if not already in user's org list
  useEffect(() => {
    let frameId: number | null = null;

    if (!urlOrgId) {
      frameId = requestAnimationFrame(() => {
        setUrlOrg(null);
      });
      return () => {
        if (frameId !== null) cancelAnimationFrame(frameId);
      };
    }
    const alreadyLoaded = organizations.some((o) => o.id === urlOrgId || o.slug === urlOrgId);
    if (alreadyLoaded) {
      frameId = requestAnimationFrame(() => {
        setUrlOrg(null);
      });
      return () => {
        if (frameId !== null) cancelAnimationFrame(frameId);
      };
    }
    fetchOrganization(urlOrgId)
      .then((org) => setUrlOrg(org))
      .catch(() => setUrlOrg(null));

    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, [urlOrgId, organizations]);

  // Static groups (profile/system) come from the Squidex singleton
  const staticGroups = useMemo<NavGroup[]>(
    () =>
      (data?.groups ?? [])
        .filter((group) => group.enabled !== false)
        .map((group) => ({
          key: group.key,
          label: group.label,
          icon: group.icon ?? undefined,
          children: (group.children ?? [])
            .filter((child) => child.enabled !== false)
            .map((child) => toNavChild(child, child.href)),
        })),
    [data]
  );

  // Template for per-organization items; href holds the path suffix (e.g. "datasets")
  const orgTemplate = useMemo(
    () => (data?.orgChildren ?? []).filter((child) => child.enabled !== false),
    [data]
  );

  const visibleGroups = useMemo(() => {
    const buildOrgChildren = (orgBase: string): NavChild[] =>
      orgTemplate.map((child) => toNavChild(child, `${orgBase}/${child.href.replace(/^\//, "")}`));

    const profileGroups = staticGroups.filter((group) => {
      return group.key !== "organization" && group.key !== "system";
    });

    const orgGroups: NavGroup[] =
      orgTemplate.length > 0
        ? organizations.map((org) => ({
            key: "organization",
            label: org.name,
            children: buildOrgChildren(`/admin/org/${org.id}`),
          }))
        : [];

    // Inject the org from the URL if it's not already in the user's org list
    if (orgTemplate.length > 0 && urlOrg && !organizations.some((o) => o.id === urlOrg.id)) {
      orgGroups.push({
        key: "organization",
        label: urlOrg.name,
        children: buildOrgChildren(`/admin/org/${urlOrg.id}`),
      });
    }

    const systemGroups = isAdmin ? staticGroups.filter((group) => group.key === "system") : [];

    return [...profileGroups, ...orgGroups, ...systemGroups];
  }, [staticGroups, orgTemplate, isAdmin, organizations, urlOrg]);

  const homeLink = data?.homeLink;
  const showHomeLink = Boolean(homeLink?.label) && homeLink?.enabled !== false;

  return (
    <nav className="admin-side-nav">
      <Sidebar variant="navigation" darkMode className="admin-sidebar-nav">
        {[
          ...(showHomeLink
            ? [
                <SidebarItem
                  key="home"
                  variant="navigation"
                  darkMode
                  className="admin-sidebar-nav__home-item"
                  item={{
                    children: (
                      <Link href={homeLink.href || "/"} className="admin-sidebar-nav__group-label">
                        {homeLink.icon && (
                          <Icon
                            name={homeLink.icon}
                            className="admin-sidebar-nav__group-icon"
                          />
                        )}
                        {homeLink.label}
                      </Link>
                    ),
                  }}
                />,
              ]
            : []),
          ...visibleGroups.map((group) => {
          const hasActiveChild = group.children.some(
            (child) => localePath.startsWith(child.href),
          );

          return (
            <SidebarItem
              key={group.label}
              variant="navigation"
              darkMode
              open={hasActiveChild}
              item={{
                children: (
                  <span className={`admin-sidebar-nav__group-label ${hasActiveChild ? "admin-sidebar-nav__group-label--active" : ""}`}>
                    {group.icon && (
                      <Icon
                        name={group.icon}
                        className="admin-sidebar-nav__group-icon"
                      />
                    )}
                    <span className="admin-sidebar-nav__group-label-text">{toSentenceCase(group.label)}</span>
                  </span>
                ),
                hasIcon: true,
                collapsedIconTrailing: "agora-line-chevron-up",
                collapsedIconHoverTrailing: "agora-solid-chevron-up",
                expandedIconTrailing: "agora-line-chevron-down",
                expandedIconHoverTrailing: "agora-solid-chevron-down",
              }}
            >
              <ul className="admin-sidebar-nav__children">
                {group.children.map((child) => {
                  const isActive = localePath.startsWith(child.href);
                  return (
                    <li key={child.href}>
                      <Link
                        href={child.href}
                        className={`admin-sidebar-nav__child-item ${
                          isActive
                            ? "admin-sidebar-nav__child-item--active"
                            : ""
                        }`}
                      >
                        {child.customIcon ? (
                          <Image
                            src={child.customIcon}
                            alt={child.label}
                            width={20}
                            height={20}
                            className="admin-sidebar-nav__child-icon"
                          />
                        ) : child.icon ? (
                          <Icon
                            name={child.icon}
                            className="admin-sidebar-nav__child-icon"
                          />
                        ) : null}
                        <span>{child.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </SidebarItem>
          );
        }),
        ]}
      </Sidebar>
    </nav>
  );
}
