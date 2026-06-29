"use client";

import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
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
import TextLink from "@/components/Primitives/TextLink";
import { areas, isEnabled, languages } from "@/config/headerNav";
import type { HeaderNavigationData, HeaderNavCard } from "@/service/types/header";
import Anchor from "./Shared/Anchor";

export const Header = ({ data }: { data: HeaderNavigationData }) => {
  const {
    topLevelLinks = [],
    authMenuItems = [],
    dropdowns = [],
    ecosytems,
  } = data;

  const ecosystemEntries = ecosytems?.ecosystemEntries ?? [];
  const artePortals = ecosytems?.artePortals ?? [];
  const allSubmenus = React.useMemo(
    () => dropdowns.flatMap((d) => d.submenus ?? []),
    [dropdowns]
  );

  const headerRef = useRef<HeaderElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { user, samlLogin } = useAuth();

  const [ecosystemOpen, setEcosystemOpen] = useState(false);
  const [ecosystemBtnPortalNode, setEcosystemBtnPortalNode] = useState<HTMLLIElement | null>(null);
  const [ecosystemPanelNode, setEcosystemPanelNode] = useState<HTMLDivElement | null>(null);

  React.useLayoutEffect(() => {
    const panelsList = document.querySelector("header.sticky .panels-menu > ul");
    if (!panelsList) return;

    let li = panelsList.querySelector(".ecosystem-panel-menu") as HTMLLIElement | null;
    if (!li) {
      li = document.createElement("li");
      li.className = "ecosystem-panel-menu";
      li.style.display = "flex";
      li.style.alignItems = "stretch";
      panelsList.appendChild(li);
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

  // Create DOM nodes for "Administração" and "Desconectar" portals
  const [adminPortalNode, setAdminPortalNode] = useState<HTMLLIElement | null>(null);
  const [logoutPortalNode, setLogoutPortalNode] = useState<HTMLLIElement | null>(null);
  React.useLayoutEffect(() => {
    const panelsList = document.querySelector("header.sticky .panels-menu > ul");
    if (!panelsList) return;

    if (user) {
      // Administração portal
      let adminLi = panelsList.querySelector(".admin-panel-menu") as HTMLLIElement | null;
      if (!adminLi) {
        adminLi = document.createElement("li");
        adminLi.className = "admin-panel-menu";
        panelsList.appendChild(adminLi);
      }

      // Desconectar portal
      let logoutLi = panelsList.querySelector(".logout-panel-menu") as HTMLLIElement | null;
      if (!logoutLi) {
        logoutLi = document.createElement("li");
        logoutLi.className = "logout-panel-menu";
        panelsList.appendChild(logoutLi);
      }

      // Keep ecosystem button always rightmost
      const ecosystemLi = panelsList.querySelector(".ecosystem-panel-menu");
      if (ecosystemLi) panelsList.appendChild(ecosystemLi);

      queueMicrotask(() => {
        setAdminPortalNode(adminLi);
        setLogoutPortalNode(logoutLi);
      });
    } else {
      panelsList.querySelector(".admin-panel-menu")?.remove();
      panelsList.querySelector(".logout-panel-menu")?.remove();
      queueMicrotask(() => {
        setAdminPortalNode(null);
        setLogoutPortalNode(null);
      });
    }

    return () => {
      panelsList.querySelector(".admin-panel-menu")?.remove();
      panelsList.querySelector(".logout-panel-menu")?.remove();
      setAdminPortalNode(null);
      setLogoutPortalNode(null);
    };
  }, [user]);

  const [selectedLanguage, setSelectedLanguage] = useState("pt");
  const [submenu, setSubmenu] = useState<string | null>(null);
  const selectedArea = pathname === "/login" ? "2" : "1";
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setSubmenu(null);
    setEcosystemOpen(false);
  }

  React.useEffect(() => {
    headerRef.current?.closeAll?.();
  }, [pathname]);

  // Position ecosystem panel right below the panels-menu bar (covering the nav bar)
  React.useEffect(() => {
    if (!ecosystemOpen) return;
    const panelDiv = document.querySelector(
      ".ecosystem-panel-container"
    ) as HTMLDivElement | null;
    if (!panelDiv) return;
    const panelsMenu = document.querySelector("header.sticky .panels-menu");
    if (panelsMenu) {
      const rect = panelsMenu.getBoundingClientRect();
      panelDiv.style.top = `${rect.bottom}px`;
    }
  }, [ecosystemOpen, ecosystemPanelNode]);

  // Mark header when on auth pages so CSS can style the "Autenticar" button
  const isAuthPage = pathname === "/login" || pathname === "/login";

  // Reset submenu when clicking anywhere outside the card grid (.links)
  const handleHeaderClickCapture = React.useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest(".links")) {
      setSubmenu(null);
    }
    if (!target.closest("li.ecosystem-panel-menu") && !target.closest(".ecosystem-custom-panel")) {
      setEcosystemOpen(false);
    }
  }, []);

  React.useLayoutEffect(() => {
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

  const currentLangLabel =
    languages.find((l) => l.value === selectedLanguage)?.label || "Português";
  const currentAreaLabel = areas.find((a) => a.value === selectedArea)?.label || "Portal";

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
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
          Voltar
        </Button>
      </div>
    </NavigationLink>
  );

  const adminItem = authMenuItems.find((i) => i.id === "admin");
  const logoutItem = authMenuItems.find((i) => i.id === "logout");

  return (
    <>
      <header
        className="sticky top-0 z-sticky [&_.custom-search-layout]:!m-0 [&_.custom-search-layout]:!mx-auto"
        data-submenu={submenu ?? undefined}
        data-auth-page={isAuthPage || undefined}
        data-no-user={!user || undefined}
        onClickCapture={handleHeaderClickCapture}
      >
        <AgoraHeader ref={headerRef} maxNavigationItems={6}>
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

          <GeneralBar aria-label="Opções navegação geral">
            <Areas
              aria-label="Áreas do portal"
              // @ts-expect-error - Prop label does exist in component logic
              label={currentAreaLabel}
              onChange={() => { }}
            >
              {areas.map((area) => {
                const areaEl = (
                  <Area
                    value={area.value}
                    label={area.label}
                    onClick={() => router.push(area.href)}
                    active={selectedArea === area.value}
                  />
                );
                return area.hidden ? (
                  <div key={area.value} className="hidden">
                    {areaEl}
                  </div>
                ) : (
                  <React.Fragment key={area.value}>{areaEl}</React.Fragment>
                );
              })}
            </Areas>

            <Languages
              aria-label="Selecionar idioma"
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

            <Search label="Pesquisar">
              <CustomSearch>
                <div className="max-w-xl">
                  <SearchDropdown
                    id="header-search"
                    hasVoiceActionButton={false}
                    label="O que procura no Portal?"
                    placeholder="Pesquisar conjunto de dados, organizações, temas..."
                    excludeTypes={["dataservices"]}
                  />
                </div>
              </CustomSearch>
            </Search>

            <Unauthenticated
              label={user ? `${user.first_name} ${user.last_name}` : "Autenticar"}
              aria-label={user ? `${user.first_name} ${user.last_name}` : "Autenticar"}
            >
              <UnauthenticatedLink
                hasIcon
                leadingIcon="agora-line-user"
                leadingIconHover="agora-solid-user"
              >
                <Link
                  href={
                    user
                      ? `/users/${user.slug}`
                      : `/login${pathname && pathname !== "/login" ? `?next=${encodeURIComponent(pathname)}` : ""}`
                  }
                >
                  {user ? `${user.first_name} ${user.last_name}` : "Autenticar"}
                </Link>
              </UnauthenticatedLink>
            </Unauthenticated>
          </GeneralBar>

          <NavigationBar
            responsiveMenuLabel="Menu"
            responsiveMenuAriaLabel="Abrir menu"
            responsiveMenuBackToRootLabel="Voltar ao início"
            modalMenuLabel="Navegação Principal"
            modalAriaLabel="Menu de navegação"
            modalCloseLabel="Fechar"
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
      {adminPortalNode &&
        adminItem &&
        createPortal(
          <div className="panel-menu unauthenticated-panel-menu">
            <span className="agora-link-wrapper agora-link-wrapper-link-neutral full-width custom-header-link-wrapper panel-menu-link-wrapper inline-flex min-h-[44px] min-w-[44px] !items-center !justify-center ">
              <Link className="link-with-icon" href={adminItem.href ?? "#"}>
                <div className="icon-wrapper leading">
                  <Icon name={adminItem.icon ?? ""} dimensions="s" />
                </div>
                <span className="children-wrapper">{adminItem.label}</span>
              </Link>
            </span>
          </div>,
          adminPortalNode
        )}
      {logoutPortalNode &&
        logoutItem &&
        createPortal(
          <div className="panel-menu unauthenticated-panel-menu">
            <span className="agora-link-wrapper agora-link-wrapper-link-neutral full-width custom-header-link-wrapper panel-menu-link-wrapper inline-flex min-h-[44px] min-w-[44px] !items-center !justify-center">
              <a
                className="link-with-icon"
                href="#"
                onClick={async (e) => {
                  e.preventDefault();
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
                <div className="icon-wrapper leading">
                  <Icon name={logoutItem.icon ?? ""} dimensions="s" />
                </div>
                <span className="children-wrapper">{logoutItem.label}</span>
              </a>
            </span>
          </div>,
          logoutPortalNode
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
                <span className="children-wrapper">Ecossistema</span>
                <Image
                  src="/Ecossistema/arte_black_simple.svg"
                  alt="arte.gov.pt"
                  width={170}
                  height={64}
                  className="ml-8 h-20 w-auto self-center"
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
            <div className="flex w-full flex-row px-[112px] py-64">
              <div className="w-[2px] shrink-0 self-stretch bg-primary-600" />
              <div className="flex flex-1 flex-col gap-32 pl-32">
                <div className="flex flex-row items-start gap-32">
                  <div className="w-[347px] shrink-0">
                    <p
                      className="font-medium text-primary-900"
                      style={{ fontSize: "24px", lineHeight: "36px" }}
                    >
                      Ecossistema
                    </p>
                    <p
                      className="font-bold text-primary-900"
                      style={{ fontSize: "24px", lineHeight: "36px" }}
                    >
                      ARTE
                    </p>
                  </div>
                  <p className="max-w-[488px] text-base text-primary-900">
                    {ecosytems?.description ?? ""}
                  </p>
                </div>
                <div className="flex">
                  <ul
                    className="grid grid-flow-col gap-x-32 gap-y-8"
                    style={{
                      gridTemplateRows: `repeat(${Math.max(
                        1,
                        Math.ceil(ecosystemEntries.length / 2)
                      )}, minmax(0, auto))`,
                    }}
                  >
                    {ecosystemEntries.map((item) => (
                      <li key={item.href} className="max-w-256">
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
                            <span className="text-base font-medium ">
                              {item.label}
                            </span>
                          </div>
                        </Anchor>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="h-[1px] bg-primary-600" />
                <div className="flex flex-row gap-32">
                  {artePortals.map((link) => (
                    <TextLink
                      key={link.href}
                      href={link.href}
                      className="text-base hover:text-primary-800"
                    >
                      {link.label}
                    </TextLink>
                  ))}
                </div>
              </div>
            </div>
          </div>,
          ecosystemPanelNode
        )}
    </>
  );
};
