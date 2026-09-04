"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar, SidebarItem, Icon } from "@ama-pt/agora-design-system";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import type { AdminNavLink, AdminSideNavigationData } from "@/service/types/admin-side-navigation";
import { stripLocale } from "@/utils/stripLocale";

interface NavChild {
  label: string;
  href: string;
  icon?: string;
  customIcon?: string;
}

function toNavChild(link: AdminNavLink): NavChild {
  return {
    label: link.label,
    href: link.href,
    icon: link.icon ?? undefined,
    customIcon: link.logo ?? undefined,
  };
}

export function AdminSideNavigation({ data }: { data: AdminSideNavigationData }) {
  const { t } = useTranslation("admin-common");
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();
  // usePathname() is locale-prefixed (`/pt/admin/...`) because prefixDefault is
  // true; normalize before matching so `/admin`-anchored logic keeps working.
  const localePath = useMemo(() => stripLocale(pathname), [pathname]);

  const items = useMemo<NavChild[]>(() => {
    const profileGroup = (data?.groups ?? []).find(
      (group) => group.enabled !== false && group.key !== "organization" && group.key !== "system"
    );
    return (profileGroup?.children ?? [])
      .filter((child) => child.enabled !== false)
      .map(toNavChild);
  }, [data]);

  const homeLink = data?.homeLink;
  const showHomeLink = Boolean(homeLink?.label) && homeLink?.enabled !== false;

  return (
    <nav
      className={`admin-side-nav ${isExpanded ? "admin-side-nav--expanded" : "admin-side-nav--collapsed"}`}
    >
      <div className="admin-side-nav__panel">
        <button
          type="button"
          className="admin-side-nav__toggle"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((expanded) => !expanded)}
        >
          <span className="admin-side-nav__toggle-content">
            <span className="admin-side-nav__toggle-icon">
              <Icon
                name={isExpanded ? "agora-line-panel-left" : "agora-line-panel-right"}
                className="admin-side-nav__toggle-icon-glyph"
              />
            </span>
            <span className="admin-sidebar-nav__group-label-text text-base font-medium">
              {isExpanded ? t("sidebar.close") : t("sidebar.expand")}
            </span>
          </span>
        </button>
        <Sidebar variant="navigation" darkMode className="admin-sidebar-nav">
          {[
            ...items.map((item) => {
              const isActive = localePath.startsWith(item.href);

              return (
                <SidebarItem
                  key={item.href}
                  variant="navigation"
                  darkMode
                  item={{
                    children: (
                      <Link href={item.href}>
                        <span
                          className={`admin-sidebar-nav__group-label ${isActive ? "admin-sidebar-nav__group-label--active" : ""}`}
                        >
                          {item.customIcon ? (
                            <Image
                              src={item.customIcon}
                              alt=""
                              width={20}
                              height={20}
                              className="admin-sidebar-nav__group-icon"
                            />
                          ) : (
                            item.icon && (
                              <Icon name={item.icon} className="admin-sidebar-nav__group-icon" />
                            )
                          )}
                          <span className="admin-sidebar-nav__group-label-text text-base font-medium">
                            {item.label}
                          </span>
                        </span>
                      </Link>
                    ),
                  }}
                />
              );
            }),
            ...(showHomeLink
              ? [
                  <SidebarItem
                    key="home"
                    variant="navigation"
                    darkMode
                    item={{
                      children: (
                        <Link href={homeLink.href || "/"}>
                          <span className="admin-sidebar-nav__home-badge">
                            <Image
                              src="/favicon.png"
                              alt=""
                              width={24}
                              height={24}
                              className="admin-sidebar-nav__home-badge-icon"
                            />
                          </span>
                          <span className="admin-sidebar-nav__group-label-text text-base font-bold">
                            {t("header.portalTitle")}
                          </span>
                        </Link>
                      ),
                    }}
                  />,
                ]
              : []),
          ]}
        </Sidebar>
      </div>
    </nav>
  );
}
