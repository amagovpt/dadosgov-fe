"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar, SidebarItem, Icon } from "@ama-pt/agora-design-system";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import type { AdminNavLink, AdminSideNavigationData } from "@/service/types/admin-side-navigation";
import { stripLocale } from "@/utils/stripLocale";
import { useAuth } from "@/context/AuthContext";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { twJoin } from "tailwind-merge";

interface NavChild {
  label: string;
  href: string;
  icon?: string;
  customIcon?: string;
}

// In flow, not absolutely positioned. Out of flow the panel contributed nothing
// to the nav's height, so the rail could only ever be as tall as the *page* next
// to it — and the collapsed system profile (11 items, every label wrapping to two
// lines) is taller than that. It scrolled inside itself instead of stretching.
const PANEL_CLASSES = "flex flex-1 flex-col bg-primary-900";

const TOGGLE_CLASSES =
  "mt-64 flex shrink-0 cursor-pointer items-center overflow-hidden " +
  "border-none bg-transparent py-12 text-left text-base " +
  "whitespace-nowrap text-white hover:bg-[#0338a2] max-xl:hidden";

const BADGE_CLASSES = "flex size-56 shrink-0 items-center justify-center rounded-8 bg-primary-400";

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
  const localePath = useMemo(() => stripLocale(pathname), [pathname]);
  const { isAdmin } = useAuth();
  const { activeProfile } = useActiveProfile();
  const { activeOrg } = useActiveOrganization();

  const items = useMemo<NavChild[]>(() => {
    if (activeProfile.type === "organization" && activeOrg) {
      const orgBase = `/admin/org/${activeOrg.id}`;
      return (data?.orgChildren ?? [])
        .filter((child) => child.enabled !== false)
        .map((child) =>
          toNavChild({ ...child, href: `${orgBase}/${child.href.replace(/^\/+/, "")}` })
        );
    }

    if (activeProfile.type === "system" && isAdmin) {
      const systemGroup = (data?.groups ?? []).find(
        (group) => group.enabled !== false && group.key === "system"
      );
      return (systemGroup?.children ?? [])
        .filter((child) => child.enabled !== false)
        .map(toNavChild);
    }

    const profileGroup = (data?.groups ?? []).find(
      (group) => group.enabled !== false && group.key !== "organization" && group.key !== "system"
    );
    return (profileGroup?.children ?? [])
      .filter((child) => child.enabled !== false)
      .map(toNavChild);
  }, [data, activeProfile, activeOrg, isAdmin]);

  const homeLink = data?.homeLink;
  const showHomeLink = Boolean(homeLink?.label) && homeLink?.enabled !== false;

  // Collapsed labels wrap instead of being ellipsised, so the two states set
  // conflicting `overflow` / `white-space` and have to be picked, not merged.
  const labelText = isExpanded
    ? "overflow-hidden text-ellipsis whitespace-nowrap"
    : "w-full overflow-visible text-clip whitespace-normal break-words";

  // 24px of padding above and below a 24px line box is the 72px row pitch the
  // design asks for. Collapsed, `px-16` is also what leaves the 80px text column
  // that wraps the longer labels mid-word.
  const groupLabel = twJoin(
    "flex min-w-0 flex-1 items-center overflow-hidden px-16 py-24",
    isExpanded ? "justify-start gap-16" : "flex-col justify-center gap-4 text-center"
  );

  return (
    <nav
      className={twJoin(
        "admin-side-nav flex min-h-full shrink-0 flex-col",
        "transition-[width] duration-200 ease-[ease]",
        isExpanded ? "w-[388px]" : "w-112 max-md:w-64",
        !isExpanded && "admin-side-nav--collapsed"
      )}
    >
      <div className={PANEL_CLASSES}>
        <button
          type="button"
          className={twJoin(
            TOGGLE_CLASSES,
            isExpanded ? "justify-start pl-24" : "justify-center px-16"
          )}
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((expanded) => !expanded)}
        >
          <span className="flex w-72 shrink-0 flex-col items-center gap-4">
            <span className="flex size-56 shrink-0 items-center justify-center rounded-4 border border-white">
              <Icon
                name={isExpanded ? "agora-line-panel-left" : "agora-line-panel-right"}
                className="size-24 fill-white text-white"
              />
            </span>
            <span className={`${labelText} px-0 py-16 text-m-regular`}>
              {isExpanded ? t("sidebar.close") : t("sidebar.expand")}
            </span>
          </span>
        </button>
        <Sidebar
          variant="navigation"
          darkMode
          className="admin-sidebar-nav bg-transparent px-0 pt-64 pb-8"
        >
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
                          className={twJoin(
                            groupLabel,
                            isActive && "admin-sidebar-nav__group-label--active font-bold"
                          )}
                        >
                          {item.customIcon ? (
                            <Image
                              src={item.customIcon}
                              alt=""
                              width={24}
                              height={24}
                              className="size-24"
                            />
                          ) : item.icon ? (
                            // `fill-white` also suppresses the primary-600 fill the DS
                            // injects when an Icon carries no `fill-` / `text-` class.
                            <Icon name={item.icon} className="size-24 fill-white text-white" />
                          ) : (
                            <span aria-hidden className="size-24 shrink-0" />
                          )}
                          <span className={`${labelText} text-m-regular`}>{item.label}</span>
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
                          <span className={`admin-sidebar-nav__home-badge ${BADGE_CLASSES}`}>
                            <Image
                              src="/favicon.png"
                              alt=""
                              width={38}
                              height={38}
                              className="size-[38px] brightness-0 invert"
                            />
                          </span>
                          <span className={`${labelText} text-base font-bold`}>
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
