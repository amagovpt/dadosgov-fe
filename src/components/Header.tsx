"use client";

import {
  ComponentProps,
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
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Header as AgoraHeader,
  Brand,
  Logo,
  GeneralBar,
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
  NavigationFreestyle,
  NavigationLink,
  NavigationRoot,
  NavigationSection,
  Button,
  HeaderElement,
} from "@ama-pt/agora-design-system";
import SearchDropdown from "@/components/search/SearchDropdown";
import { HeaderCard } from "@/components/HeaderCard";
import { useAuth } from "@/context/AuthContext";
import { logout } from "@/service/api/auth";
import { stripLocale } from "@/utils/stripLocale";
import { useCurrentLocale, useLocalizedHref } from "@/hooks/useLocalizedHref";
import { LocalizedLink } from "./Shared/LocalizedLink";
import { isEnabled, languages } from "@/config/headerNav";
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
  // Nav hrefs from the CMS/config carry no locale prefix; localize them before
  // navigating so the i18n proxy never has to 307 (prefetch-loop fix).
  const localizeHref = useLocalizedHref();
  const currentLocale = useCurrentLocale();
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


    let li = panelsList.querySelector(".ecosystem-custom-menu") as HTMLLIElement | null;
    if (!li) {
      li = document.createElement("li");
      li.className = "ecosystem-custom-menu";
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
      panelsList.querySelector(".ecosystem-custom-menu")?.remove();
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

    const ecosystemLi = panelsList.querySelector(".ecosystem-custom-menu");
    const lastChild = panelsList.lastElementChild;
    if (ecosystemLi && lastChild && lastChild !== ecosystemLi) {
      panelsList.insertBefore(ecosystemLi, lastChild);
    }
  }, [user]);

  const [submenu, setSubmenu] = useState<string | null>(null);
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setSubmenu(null);
    setEcosystemOpen(false);
  }

  useEffect(() => {
    headerRef.current?.closeAll?.();
  }, [pathname]);

  const handleLanguageChange = (newLocale: string) => {
    if (!languages.some((language) => language.value === newLocale)) return;

    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    document.cookie = `NEXT_LOCALE=${newLocale}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;

    const localizedPath = `/${newLocale}${localePath === "/" ? "" : localePath}`;
    const search = window.location.search;
    const hash = window.location.hash;
    router.push(`${localizedPath}${search}${hash}`);
    router.refresh();
  };

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

  // Reset submenu when clicking anywhere outside the card grid. The grid is now
  // `.header-nav-cards` (we render it inside <NavigationFreestyle>); it used to be
  // the AgoraDS 3 `.links` container, which the DS no longer renders for us.
  const handleHeaderClickCapture = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest(".header-nav-cards")) {
      setSubmenu(null);
    }
    if (!target.closest("li.ecosystem-custom-menu") && !target.closest(".ecosystem-custom-panel")) {
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

  const handleLinkClick = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    // Close all menus/panels via design system API
    if (headerRef.current?.closeAll) {
      headerRef.current.closeAll();
    }
    setSubmenu(null);

    if (href !== "#") {
      router.push(localizeHref(href));
    }
  };

  // Renders one HeaderCard as a direct grid item of `.header-nav-cards`. Cards with
  // `opensSubmenu` get the button wrapper that switches the active submenu instead
  // of navigating. The `data-group` attribute is what the submenu CSS keys off.
  //
  // Deliberately NOT wrapped in <NavigationLink>: in AgoraDS 4 that component's
  // props are AnchorProps and it renders an <a>, so the card — which carries its
  // own anchor — would end up nested inside one. See <NavigationFreestyle> below.
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
    return card.opensSubmenu ? (
      <div
        key={card.id}
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
      <div key={card.id} data-group={dataGroup}>
        {cardEl}
      </div>
    );
  };

  // "Voltar" button that closes the active submenu.
  const renderBackButton = (submenuId: string) => (
    <div key={`back-${submenuId}`} data-group={`submenu-${submenuId}`} data-is-back="true">
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
              <LocalizedLink href="/" className="flex items-center">
                <Image
                  src="/Logos/Dados.gov_logocores.png"
                  alt="dados.gov.pt"
                  height={43}
                  width={254}
                  priority
                />
              </LocalizedLink>
            </Logo>
          </Brand>

          <GeneralBar aria-label={t("header.generalNavigation")}>
            <Languages
              aria-label={t("header.selectLanguage")}
              onChange={handleLanguageChange}
            >
              {languages.map((lang) => (
                <Language
                  key={lang.value}
                  value={lang.value}
                  label={lang.label}
                  abbr={lang.abbr}
                  icon={lang.icon}
                  checked={currentLocale === lang.value}
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
                      <LocalizedLink href={`/users/${user.slug}`}>
                        {t("header.profile")}
                      </LocalizedLink>
                    </AuthenticatedBodyLink>,
                    adminItem ? (
                      <AuthenticatedBodyLink
                        key="admin"
                        hasIcon
                        leadingIcon="agora-line-hardware-settings"
                        leadingIconHover="agora-solid-hardware-settings"
                      >
                        <LocalizedLink href={adminItem.href ?? "#"}>{adminItem.label}</LocalizedLink>
                      </AuthenticatedBodyLink>
                    ) : null,
                    <AuthenticatedBodyLink
                      key="notifications"
                      hasIcon
                      leadingIcon="agora-line-mega-phone"
                      leadingIconHover="agora-solid-mega-phone"
                    >
                      <LocalizedLink href="/admin/notificacoes">
                        {t("header.notifications")}
                      </LocalizedLink>
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
                  <LocalizedLink
                    href={`/login${pathname && localePath !== "/login" ? `?next=${encodeURIComponent(pathname)}` : ""}`}
                  >
                    {t("header.signIn")}
                  </LocalizedLink>
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
            <NavigationSection>
              {[
                ...topLevelLinks
                  .filter((link) => isEnabled(link, !!user))
                  .map((link) => (
                    <NavigationLink
                      key={link.id ?? link.href}
                      href={localizeHref(link.href)}
                      onClick={(e) => {
                        e.preventDefault();
                        handleLinkClick(e, link.href);
                      }}
                    >
                      {link.label}
                    </NavigationLink>
                  )),
                ...dropdowns
                  .filter((d) => isEnabled(d.root, !!user))
                  .map((d) => (
                    <NavigationRoot key={d.root.id} label={d.root.label}>
                      <NavigationFreestyle>
                        <div className="header-nav-cards">
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
                        </div>
                      </NavigationFreestyle>
                    </NavigationRoot>
                  )),
              ]}
            </NavigationSection>
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
