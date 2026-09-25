"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar, SidebarItem, Icon } from "@ama-pt/agora-design-system";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import type { AdminSideNavigationData } from "@/service/types/admin-side-navigation";
import { stripLocale } from "@/utils/stripLocale";
import { getAdminNavItems } from "@/utils/adminNavItems";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { twJoin } from "tailwind-merge";

const PANEL_CLASSES =
  "relative z-30 flex flex-1 flex-col bg-primary-900 " +
  "transition-[width] duration-200 ease-[ease]";

const TOGGLE_CLASSES =
  "mt-64 flex shrink-0 cursor-pointer items-center overflow-hidden " +
  "border-none bg-transparent py-12 text-left text-base " +
  "whitespace-nowrap text-white hover:bg-[#0338a2] max-xl:hidden";

const BADGE_CLASSES = "flex size-56 shrink-0 items-center justify-center rounded-8 bg-primary-400";

export function AdminSideNavigation({ data }: { data: AdminSideNavigationData }) {
  const { t } = useTranslation("admin-common");
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();
  const localePath = useMemo(() => stripLocale(pathname), [pathname]);
  const { activeProfile } = useActiveProfile();

  const items = useMemo(() => getAdminNavItems(data, activeProfile), [data, activeProfile]);

  const homeLink = data?.homeLink;
  const showHomeLink = Boolean(homeLink?.label) && homeLink?.enabled !== false;

  const labelText = isExpanded
    ? "overflow-hidden text-ellipsis whitespace-nowrap"
    : "w-full overflow-visible text-clip whitespace-normal break-words";

  const groupLabel = twJoin(
    "flex min-w-0 flex-1 items-center overflow-hidden px-16 py-24",
    isExpanded ? "justify-start gap-16" : "flex-col justify-center gap-4 text-center"
  );

  return (
    <nav
      className={twJoin(
        "admin-side-nav flex min-h-full w-112 shrink-0 flex-col max-md:w-64",
        !isExpanded && "admin-side-nav--collapsed"
      )}
    >
      <div className={twJoin(PANEL_CLASSES, isExpanded ? "w-[388px]" : "w-full")}>
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
          // Agora retains selection in the DOM and keys items by index. Reset it on navigation.
          key={localePath}
          variant="navigation"
          darkMode
          className="admin-sidebar-nav bg-transparent px-0 pt-64 pb-8"
        >
          {[
            ...items.map((item) => {
              const isActive = localePath === item.href || localePath.startsWith(`${item.href}/`);

              return (
                <SidebarItem
                  key={item.href}
                  variant="navigation"
                  darkMode
                  item={{
                    children: (
                      <Link href={item.href} aria-current={isActive ? "page" : undefined}>
                        <span
                          className={twJoin(
                            groupLabel,
                            isActive && "admin-sidebar-nav__group-label--active font-bold"
                          )}
                        >
                          {/* Agora icons load lazily; reserve their space before the SVG arrives. */}
                          <span aria-hidden className="flex size-24 shrink-0 items-center justify-center">
                            {item.customIcon ? (
                              <Image
                                src={item.customIcon}
                                alt=""
                                width={24}
                                height={24}
                                className="size-24"
                              />
                            ) : item.icon ? (
                              <Icon name={item.icon} className="size-24 fill-white text-white" />
                            ) : null}
                          </span>
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
