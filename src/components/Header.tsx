"use client";

import {
  ComponentProps,
  Fragment,
  MouseEvent,
  ReactElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Header as AgoraHeader,
  Brand,
  Logo,
  GeneralBar,
  Areas,
  Area,
  Languages,
  Language,
  Search,
  CustomSearch,
  Unauthenticated,
  UnauthenticatedLink,
  Authenticated,
  AuthenticatedHeader,
  AuthenticatedBody,
  AuthenticatedBodyLink,
  AuthenticatedFooter,
  AuthenticatedFooterAction,
  Icon,
  NavigationBar,
  NavigationLink,
  NavigationRoot,
  Button,
  HeaderElement,
} from "@ama-pt/agora-design-system";
import SearchDropdown from "@/components/search/SearchDropdown";
import { HeaderCard } from "@/components/HeaderCard";
import { useAuth } from "@/context/AuthContext";
import { logout } from "@/service/api/auth";
import { stripLocale } from "@/utils/stripLocale";
import { areas, isEnabled, languages } from "@/config/headerNav";
import type { HeaderNavigationData, HeaderNavCard } from "@/service/types/header";
import Anchor from "./Shared/Anchor";

export const Header = ({ data }: { data: HeaderNavigationData }) => {
  const { topLevelLinks = [], authMenuItems = [], dropdowns = [], ecosytems } = data;

  const ecosystemEntries = useMemo(
    () => ecosytems?.ecosystemEntries ?? [],
    [ecosytems?.ecosystemEntries]
  );

  const allSubmenus = useMemo(() => dropdowns.flatMap((d) => d.submenus ?? []), [dropdowns]);

  const headerRef = useRef<HeaderElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  // usePathname() is locale-prefixed (`/pt/login`); normalize for route
  // comparisons while keeping the full path for the post-login `next` redirect.
  const localePath = stripLocale(pathname);
  const { user, samlLogin } = useAuth();
  const { t } = useTranslation("common");
  const initials = user
    ? `${(user.first_name || "")[0] || ""}${(user.last_name || "")[0] || ""}`.toUpperCase()
    : "";
  const adminItem = authMenuItems.find((i) => i.id === "admin");
  const logoutItem = authMenuItems.find((i) => i.id === "logout");

  const [generalBarLabelPortalNode, setGeneralBarLabelPortalNode] =
    useState<HTMLSpanElement | null>(null);

  useLayoutEffect(() => {
    const generalBar = document.querySelector("header.sticky .general-bar");
    if (!generalBar) return;

    let container = generalBar.querySelector(".general-bar-label-menu") as HTMLSpanElement | null;
    if (!container) {
      container = document.createElement("span");
      container.className = "general-bar-label-menu";
      container.style.display = "flex";
      container.style.alignItems = "center";
    }
    generalBar.appendChild(container);

    queueMicrotask(() => {
      setGeneralBarLabelPortalNode(container);
    });

    return () => {
      generalBar.querySelector(".general-bar-label-menu")?.remove();
      setGeneralBarLabelPortalNode(null);
    };
  }, []);

  const [ecosystemOpen, setEcosystemOpen] = useState(false);
  const [ecosystemBtnPortalNode, setEcosystemBtnPortalNode] = useState<HTMLLIElement | null>(null);
  const [ecosystemPanelNode, setEcosystemPanelNode] = useState<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const panelsList = document.querySelector("header.sticky .panels-menu > ul");
    if (!panelsList) return;

    let li = panelsList.querySelector(".ecosystem-panel-menu") as HTMLLIElement | null;
    if (!li) {
      li = document.createElement("li");
      li.className = "ecosystem-panel-menu";
      li.style.display = "flex";
      li.style.alignItems = "stretch";
      const authLi = panelsList.lastElementChild;
      if (authLi) {
        panelsList.insertBefore(li, authLi);
      } else {
        panelsList.appendChild(li);
      }
    }

    let panelDiv = document.querySelector(".ecosystem-panel-container") as HTMLDivElement | null;
    if (!panelDiv) {
      panelDiv = document.createElement("div");
      panelDiv.className = "ecosystem-panel-container";
      document.body.appendChild(panelDiv);
    }

    queueMicrotask(() => {
      setEcosystemBtnPortalNode(li);
      setEcosystemPanelNode(panelDiv);
    });

    return () => {
      panelsList.querySelector(".ecosystem-panel-menu")?.remove();
      document.querySelector(".ecosystem-panel-container")?.remove();
      setEcosystemBtnPortalNode(null);
      setEcosystemPanelNode(null);
    };
  }, []);

  // Keep the ecosystem <li> immediately before the auth slot across
  // Authenticated <-> Unauthenticated transitions (React appends the newly
  // mounted one at the physical end of the list, after our DOM-injected
  // ecosystem <li>, so this just re-asserts the intended order).
  useLayoutEffect(() => {
    const panelsList = document.querySelector("header.sticky .panels-menu > ul");
    if (!panelsList) return;

    const ecosystemLi = panelsList.querySelector(".ecosystem-panel-menu");
    const lastChild = panelsList.lastElementChild;
    if (ecosystemLi && lastChild && lastChild !== ecosystemLi) {
      panelsList.insertBefore(ecosystemLi, lastChild);
    }
  }, [user]);

  const [selectedLanguage, setSelectedLanguage] = useState("pt");
  const [submenu, setSubmenu] = useState<string | null>(null);
  const selectedArea = localePath === "/login" ? "2" : "1";
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setSubmenu(null);
    setEcosystemOpen(false);
  }

  useEffect(() => {
    headerRef.current?.closeAll?.();
  }, [pathname]);

  // Position ecosystem panel right below the panels-menu bar (covering the nav bar)
  useEffect(() => {
    if (!ecosystemOpen) return;
    const panelDiv = document.querySelector(".ecosystem-panel-container") as HTMLDivElement | null;
    if (!panelDiv) return;
    const panelsMenu = document.querySelector("header.sticky .panels-menu");
    if (panelsMenu) {
      const rect = panelsMenu.getBoundingClientRect();
      panelDiv.style.top = `${rect.bottom}px`;
      panelDiv.style.maxHeight = `${window.innerHeight - rect.bottom}px`;
      panelDiv.style.overflowY = "auto";
    }
  }, [ecosystemOpen, ecosystemPanelNode]);

  // Mark header when on auth pages so CSS can style the "Autenticar" button
  const isAuthPage = localePath === "/login";

  // Reset submenu when clicking anywhere outside the card grid (.links)
  const handleHeaderClickCapture = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest(".links")) {
      setSubmenu(null);
    }
    if (!target.closest("li.ecosystem-panel-menu") && !target.closest(".ecosystem-custom-panel")) {
      setEcosystemOpen(false);
    }
  }, []);

  useLayoutEffect(() => {
    const submenuTitles: Record<string, string> = Object.fromEntries(
      allSubmenus.map((s) => [s.id, s.label])
    );
    const titleEl = document.querySelector(
      ".agora-header .navigation-links-layout > .title"
    ) as HTMLElement | null;
    if (!titleEl) return;
    if (submenu && submenuTitles[submenu]) {
      if (!titleEl.dataset.originalTitle) {
        titleEl.dataset.originalTitle = titleEl.textContent || "Recursos";
      }
      titleEl.textContent = submenuTitles[submenu];
    } else if (titleEl.dataset.originalTitle) {
      titleEl.textContent = titleEl.dataset.originalTitle;
      delete titleEl.dataset.originalTitle;
    }
  }, [submenu, allSubmenus]);

  const currentAreaLabel = areas.find((a) => a.value === selectedArea)?.label || t("header.portal");

  const handleLinkClick = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    // Close all menus/panels via design system API
    if (headerRef.current?.closeAll) {
      headerRef.current.closeAll();
    }
    setSubmenu(null);

    if (href !== "#") {
      router.push(href);
    }
  };

  // Renders a HeaderCard inside a NavigationLink. Cards with `opensSubmenu` get
  // the button wrapper that switches the active submenu instead of navigating.
  const renderCard = (card: HeaderNavCard, dataGroup: string) => {
    const cardEl = (
      <HeaderCard
        iconDefault={card.iconDefault}
        iconHover={card.iconHover}
        title={card.title}
        description={card.description}
        href={card.href}
        onLinkClick={handleLinkClick}
      />
    );
    return (
      <NavigationLink key={card.id} appearance="link">
        {card.opensSubmenu ? (
          <div
            data-group={dataGroup}
            role="button"
            tabIndex={0}
            onClickCapture={(e) => {
              e.preventDefault();
              setSubmenu(card.opensSubmenu!);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSubmenu(card.opensSubmenu!);
              }
            }}
            className="cursor-pointer"
          >
            {cardEl}
          </div>
        ) : (
          <div data-group={dataGroup}>{cardEl}</div>
        )}
      </NavigationLink>
    );
  };

  // "Voltar" button that closes the active submenu.
  const renderBackButton = (submenuId: string) => (
    <NavigationLink key={`back-${submenuId}`} appearance="link">
      <div data-group={`submenu-${submenuId}`} data-is-back="true">
        <Button
          appearance="link"
          variant="neutral"
          hasIcon
          leadingIcon="agora-line-arrow-left-anchor"
          leadingIconHover="agora-solid-arrow-left-anchor"
          onClick={(e) => {
            e.stopPropagation();
            setSubmenu(null);
          }}
        >
          {t("header.back")}
        </Button>
      </div>
    </NavigationLink>
  );

  return (
    <>
      <header
        className="sticky top-0 z-sticky [&_.custom-search-layout]:!m-0 [&_.custom-search-layout]:!mx-auto"
        data-submenu={submenu ?? undefined}
        data-auth-page={isAuthPage || undefined}
        data-no-user={!user || undefined}
        onClickCapture={handleHeaderClickCapture}
      >
        <AgoraHeader ref={headerRef} maxNavigationItems={7}>
          <Brand>
            <Logo>
              <Link href="/" className="flex items-center">
                <Image
                  src="/Logos/Dados.gov_logocores.png"
                  alt="dados.gov.pt"
                  height={43}
                  width={251}
                  priority
                />
              </Link>
            </Logo>
          </Brand>

          <GeneralBar aria-label={t("header.generalNavigation")}>
            <Areas
              aria-label={t("header.portalAreas")}
              // @ts-expect-error - Prop label does exist in component logic
              label={currentAreaLabel}
              onChange={() => {}}
            >
              {areas.map((area) => {
                const areaEl = (
                  <Area
                    value={area.value}
                    label={area.value === "1" ? t("header.portal") : area.label}
                    onClick={() => router.push(area.href)}
                    active={selectedArea === area.value}
                  />
                );
                return area.hidden ? (
                  <div key={area.value} className="hidden">
                    {areaEl}
                  </div>
                ) : (
                  <Fragment key={area.value}>{areaEl}</Fragment>
                );
              })}
            </Areas>
            <Languages
              aria-label={t("header.selectLanguage")}
              onChange={(lang: string) => setSelectedLanguage(lang)}
            >
              {languages.map((lang) => (
                <Language
                  key={lang.value}
                  value={lang.value}
                  label={lang.label}
                  abbr={lang.abbr}
                  checked={selectedLanguage === lang.value}
                />
              ))}
            </Languages>

            <Search label={t("header.search")}>
              <CustomSearch>
                <div className="max-w-xl">
                  <SearchDropdown
                    id="header-search"
                    hasVoiceActionButton={false}
                    label={t("header.searchLabel")}
                    placeholder={t("header.searchPlaceholder")}
                  />
                </div>
              </CustomSearch>
            </Search>

            {user ? (
              <Authenticated
                avatarType={user.avatar_thumbnail ? "image" : initials ? "initials" : "icon"}
                srcPath={
                  (user.avatar_thumbnail || initials || "agora-line-user") as unknown as undefined
                }
                alt={`${user.first_name} ${user.last_name}`}
                information={`${user.first_name} ${user.last_name}`}
              >
                <AuthenticatedHeader>
                  {user.first_name} {user.last_name}
                </AuthenticatedHeader>
                <AuthenticatedBody>
                  {[
                    <AuthenticatedBodyLink
                      key="profile"
                      hasIcon
                      leadingIcon="agora-line-user"
                      leadingIconHover="agora-solid-user"
                    >
                      <Link href={`/users/${user.slug}`}>{t("header.profile")}</Link>
                    </AuthenticatedBodyLink>,
                    adminItem ? (
                      <AuthenticatedBodyLink
                        key="admin"
                        hasIcon
                        leadingIcon="agora-line-hardware-settings"
                        leadingIconHover="agora-solid-hardware-settings"
                      >
                        <Link href={adminItem.href ?? "#"}>{adminItem.label}</Link>
                      </AuthenticatedBodyLink>
                    ) : null,
                    <AuthenticatedBodyLink
                      key="notifications"
                      hasIcon
                      leadingIcon="agora-line-mega-phone"
                      leadingIconHover="agora-solid-mega-phone"
                    >
                      <Link href="/admin/notificacoes">{t("header.notifications")}</Link>
                    </AuthenticatedBodyLink>,
                  ].filter(
                    (el): el is ReactElement<ComponentProps<typeof AuthenticatedBodyLink>> =>
                      el !== null
                  )}
                </AuthenticatedBody>
                <AuthenticatedFooter>
                  <AuthenticatedFooterAction
                    hasIcon
                    leadingIcon="agora-line-log-out"
                    leadingIconHover="agora-solid-log-out"
                    appearance="link"
                    onClick={async () => {
                      if (samlLogin) {
                        window.location.href = "/saml/logout";
                        return;
                      }
                      try {
                        await logout();
                      } catch (error) {
                        console.error("Logout error:", error);
                      }
                      window.location.href = "/";
                    }}
                  >
                    {logoutItem?.label ?? t("header.logout")}
                  </AuthenticatedFooterAction>
                </AuthenticatedFooter>
              </Authenticated>
            ) : (
              <Unauthenticated label={t("header.signIn")} aria-label={t("header.signIn")}>
                <UnauthenticatedLink
                  hasIcon
                  leadingIcon="agora-line-user"
                  leadingIconHover="agora-solid-user"
                >
                  <Link
                    href={`/login${pathname && localePath !== "/login" ? `?next=${encodeURIComponent(pathname)}` : ""}`}
                  >
                    {t("header.signIn")}
                  </Link>
                </UnauthenticatedLink>
              </Unauthenticated>
            )}
          </GeneralBar>

          <NavigationBar
            responsiveMenuLabel={t("header.menu")}
            responsiveMenuAriaLabel={t("header.openMenu")}
            responsiveMenuBackToRootLabel={t("header.backToHome")}
            modalMenuLabel={t("header.mainNavigation")}
            modalAriaLabel={t("header.navigationMenu")}
            modalCloseLabel={t("header.close")}
          >
            {[
              ...topLevelLinks
                .filter((link) => isEnabled(link, !!user))
                .map((link) => (
                  <NavigationLink key={link.id ?? link.href} appearance="link">
                    <Link href={link.href} onClick={(e) => handleLinkClick(e, link.href)}>
                      {link.label}
                    </Link>
                  </NavigationLink>
                )),
              ...dropdowns
                .filter((d) => isEnabled(d.root, !!user))
                .map((d) => (
                  <NavigationRoot key={d.root.id} label={d.root.label}>
                    {d.root.cards
                      .filter((card) => isEnabled(card, !!user))
                      .flatMap((card) => {
                        const mainEl = renderCard(card, "main");
                        const submenu = card.opensSubmenu
                          ? d.submenus.find((s) => s.id === card.opensSubmenu)
                          : undefined;
                        if (!submenu) return [mainEl];
                        return [
                          mainEl,
                          renderBackButton(submenu.id),
                          ...submenu.cards
                            .filter((c) => isEnabled(c, !!user))
                            .map((c) => renderCard(c, `submenu-${submenu.id}`)),
                        ];
                      })}
                  </NavigationRoot>
                )),
            ]}
          </NavigationBar>
        </AgoraHeader>
      </header>
      {generalBarLabelPortalNode &&
        createPortal(
          <span className="text-sm font-regular hidden text-primary-900 md:inline">
            {t("generalBarLabel")}
          </span>,
          generalBarLabelPortalNode
        )}
      {ecosystemBtnPortalNode &&
        createPortal(
          <>
            <span className="agora-link-wrapper agora-link-wrapper-link-neutral custom-header-link-wrapper panel-menu-link-wrapper inline-flex items-center !px-8">
              <a
                className="link-with-icon"
                href="#"
                aria-expanded={ecosystemOpen}
                onClick={(e) => {
                  e.preventDefault();
                  setEcosystemOpen((o) => !o);
                }}
              >
                <div className="icon-wrapper leading flex items-center">
                  <Icon name="agora-line-dashboard" className="h-24 w-24" />
                </div>
                <span className="children-wrapper hidden md:inline">{t("header.ecosystem")}</span>
                <Image
                  src="/Ecossistema/arte_black_simple.svg"
                  alt="arte.gov.pt"
                  width={42}
                  height={16}
                  className="ml-8 hidden h-16 w-auto self-center md:block"
                />
              </a>
            </span>
          </>,
          ecosystemBtnPortalNode
        )}
      {ecosystemPanelNode &&
        ecosystemOpen &&
        createPortal(
          <div className="ecosystem-custom-panel">
            <div className="container mx-auto flex w-full flex-col py-16 md:flex-row md:py-32">
              <div className="flex flex-1 flex-col gap-16 pl-0 md:gap-32">
                <div className="flex flex-row items-start gap-32">
                  <p className="text-base font-bold text-primary-900">
                    {ecosytems?.description ?? ""}
                  </p>
                </div>
                <div>
                  <ul className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
                    {ecosystemEntries.map((item) => (
                      <li key={item.href} className="w-full max-w-full">
                        <Anchor
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          appearance="link"
                        >
                          <div className="flex items-center gap-8 py-8">
                            <div
                              className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full"
                              style={{ backgroundColor: item.bgColor ?? undefined }}
                            >
                              <div className="relative h-[20px] w-[20px]">
                                <Image
                                  src={item.logo ?? ""}
                                  alt={item.label}
                                  fill
                                  className="object-contain"
                                />
                              </div>
                            </div>
                            <span className="text-base font-medium">{item.label}</span>
                          </div>
                        </Anchor>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>,
          ecosystemPanelNode
        )}
    </>
  );
};
