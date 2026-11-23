"use client";

import {
  KeyboardEvent,
  MouseEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  EcosystemPanel,
  EcosystemPanelAnchor,
  EcosystemPanelTitle,
  NavigationBar,
  NavigationLink,
  NavigationRoot,
  NavigationSection,
  Icon,
  HeaderElement,
  NavigationArea,
} from "@ama-pt/agora-design-system";
import SearchDropdown from "@/components/search/SearchDropdown";
import { AdminProfileSwitcher } from "@/components/admin/AdminProfileSwitcher";
import { useAuth } from "@/context/AuthContext";
import { logout } from "@/service/api/auth";
import { stripLocale } from "@/utils/stripLocale";
import { useCurrentLocale, useLocalizedHref } from "@/hooks/useLocalizedHref";
import { LocalizedLink } from "./Shared/LocalizedLink";
import { isEnabled, languages } from "@/config/headerNav";
import type { HeaderNavigationData, HeaderNavCard } from "@/service/types/header";

export const Header = ({ data }: { data: HeaderNavigationData }) => {
  const { topLevelLinks = [], dropdowns = [], ecosytems } = data;

  const ecosystemEntries = useMemo(
    () => ecosytems?.ecosystemEntries ?? [],
    [ecosytems?.ecosystemEntries]
  );

  const allSubmenus = useMemo(() => dropdowns.flatMap((d) => d.submenus ?? []), [dropdowns]);

  const headerRef = useRef<HeaderElement>(null);
  const wrapperRef = useRef<HTMLElement>(null);
  const submenuReturnFocusRef = useRef<string | null>(null);
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
  const { t } = useTranslation(["common", "admin-common"]);
  const initials = user
    ? `${(user.first_name || "")[0] || ""}${(user.last_name || "")[0] || ""}`.toUpperCase()
    : "";

  const [submenu, setSubmenu] = useState<string | null>(null);
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setSubmenu(null);
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

  // Mark header when on auth pages so CSS can style the "Autenticar" button
  const isAuthPage = localePath === "/login";

  const handleHeaderClickCapture = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest(".header-menu-link")) {
      setSubmenu(null);
    }
  }, []);

  useLayoutEffect(() => {
    const submenuTitles: Record<string, string> = Object.fromEntries(
      allSubmenus.map((s) => [s.id, s.label])
    );
    const titleEl = wrapperRef.current?.querySelector<HTMLElement>(
      ".navigation-links-layout > .title"
    );
    if (titleEl) {
      if (submenu && submenuTitles[submenu]) {
        if (!titleEl.dataset.originalTitle) {
          titleEl.dataset.originalTitle = titleEl.textContent || "Recursos";
        }
        titleEl.textContent = submenuTitles[submenu];
      } else if (titleEl.dataset.originalTitle) {
        titleEl.textContent = titleEl.dataset.originalTitle;
        delete titleEl.dataset.originalTitle;
      }
    }

    const links = wrapperRef.current?.querySelectorAll<HTMLAnchorElement>(".header-menu-link");
    const focusTarget = Array.from(links ?? []).find(
      (link) =>
        link.offsetWidth > 0 &&
        (submenu
          ? link.classList.contains("header-menu-back")
          : submenuReturnFocusRef.current && link.dataset.submenu === submenuReturnFocusRef.current)
    );
    focusTarget?.focus();
    submenuReturnFocusRef.current = null;
  }, [submenu, allSubmenus]);

  const handleLinkClick = (href: string) => {
    // Close all menus/panels via design system API
    if (headerRef.current?.closeAll) {
      headerRef.current.closeAll();
    }
    setSubmenu(null);

    if (href !== "#") {
      router.push(localizeHref(href));
    }
  };

  const handleMenuButtonKeyDown = (e: KeyboardEvent<HTMLAnchorElement>) => {
    if (e.key === " ") {
      e.preventDefault();
      e.currentTarget.click();
    }
  };

  const renderMenuLink = (card: HeaderNavCard) => (
    <NavigationLink
      key={card.id}
      className="header-menu-link"
      fullWidth
      hasIcon
      leadingIcon={card.iconDefault}
      leadingIconHover={card.iconHover}
      trailingIcon="agora-line-arrow-right-circle"
      trailingIconHover="agora-solid-arrow-right-circle"
      href={card.opensSubmenu ? "#" : localizeHref(card.href)}
      role={card.opensSubmenu ? "button" : undefined}
      data-submenu={card.opensSubmenu ?? undefined}
      onKeyDown={card.opensSubmenu ? handleMenuButtonKeyDown : undefined}
      onClick={(e) => {
        e.preventDefault();
        if (card.opensSubmenu) {
          setSubmenu(card.opensSubmenu);
        } else {
          handleLinkClick(card.href);
        }
      }}
    >
      {card.title}
    </NavigationLink>
  );

  const renderBackButton = (submenuId: string) => (
    <NavigationLink
      key={`back-${submenuId}`}
      className="header-menu-link header-menu-back"
      href="#"
      role="button"
      hasIcon
      leadingIcon="agora-line-arrow-left-anchor"
      leadingIconHover="agora-solid-arrow-left-anchor"
      onKeyDown={handleMenuButtonKeyDown}
      onClick={(e) => {
        e.preventDefault();
        submenuReturnFocusRef.current = submenuId;
        setSubmenu(null);
      }}
    >
      {t("header.back")}
    </NavigationLink>
  );

  return (
    <>
      <header
        ref={wrapperRef}
        className="profile-menu-header [&_.custom-search-layout]:m-0! [&_.custom-search-layout]:mx-auto! [&_.ecosystem-panel-title]:text-m-bold! [&_.navigation-container]:relative!"
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
            <Languages aria-label={t("header.selectLanguage")} onChange={handleLanguageChange}>
              {languages.map((lang) => (
                <Language
                  key={lang.value}
                  value={lang.value}
                  label={t(lang.labelKey)}
                  abbr={lang.abbr}
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
            <EcosystemPanel
              text={<span>{t("header.ecosystem")}</span>}
              logo={
                <Image
                  src="/Ecossistema/arte_black_simple.svg"
                  alt="arte.gov.pt"
                  width={42}
                  height={16}
                  className="h-16 w-auto self-center"
                />
              }
            >
              <EcosystemPanelTitle>{ecosytems?.description ?? ""}</EcosystemPanelTitle>
              {ecosystemEntries.map((item) => (
                <EcosystemPanelAnchor
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  appearance="link"
                >
                  <span
                    className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: item.bgColor ?? undefined }}
                  >
                    <span className="relative block h-20 w-20">
                      <Image
                        src={item.logo ?? ""}
                        alt={item.label}
                        fill
                        className="object-contain"
                      />
                    </span>
                  </span>
                  <span className="text-base font-medium">{item.label}</span>
                </EcosystemPanelAnchor>
              ))}
            </EcosystemPanel>

            {user ? (
              <Authenticated
                avatarType={user.avatar_thumbnail ? "image" : initials ? "initials" : "icon"}
                srcPath={user.avatar_thumbnail || initials || "agora-line-user"}
                alt={`${user.first_name} ${user.last_name}`}
                information={`${user.first_name} ${user.last_name}`}
              >
                <AuthenticatedHeader closeAriaLabel={t("close")}>
                  {user.first_name} {user.last_name}
                  <Icon
                    name="agora-line-x"
                    className="absolute top-1/2 right-16 size-24 -translate-y-1/2 fill-white"
                    aria-hidden
                  />
                </AuthenticatedHeader>
                <AuthenticatedBody>
                  <AuthenticatedBodyLink
                    hasIcon
                    leadingIcon="agora-line-user"
                    leadingIconHover="agora-solid-user"
                  >
                    <LocalizedLink href={`/users/${user.slug}`}>
                      {t("header.profile", { ns: "admin-common" })}
                    </LocalizedLink>
                  </AuthenticatedBodyLink>
                  <AuthenticatedBodyLink
                    hasIcon
                    leadingIcon="agora-line-mega-phone"
                    leadingIconHover="agora-solid-mega-phone"
                  >
                    <LocalizedLink href="/admin/notificacoes">
                      {t("header.notifications", { ns: "admin-common" })}
                    </LocalizedLink>
                  </AuthenticatedBodyLink>
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
                    {t("header.logout", { ns: "admin-common" })}
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
              <NavigationArea className="header-institutional absolute top-[-68px]! left-0! hover:cursor-text hover:no-underline [&.navigation-area.selected]:border-t-0! [&.navigation-area.selected]:bg-transparent!">
                {data.institutional}
              </NavigationArea>
              {[
                ...topLevelLinks
                  .filter((link) => isEnabled(link, !!user))
                  .map((link) => (
                    <NavigationLink
                      key={link.id ?? link.href}
                      href={localizeHref(link.href)}
                      onClick={(e) => {
                        e.preventDefault();
                        handleLinkClick(link.href);
                      }}
                    >
                      {link.label}
                    </NavigationLink>
                  )),
                ...dropdowns
                  .filter((d) => isEnabled(d.root, !!user))
                  .map((d) => {
                    const activeSubmenu = d.submenus.find((item) => item.id === submenu);
                    const cards = activeSubmenu?.cards ?? d.root.cards;
                    return (
                      <NavigationRoot
                        key={d.root.id}
                        label={d.root.label}
                        linksAriaLabel={activeSubmenu?.label ?? d.root.label}
                      >
                        {[
                          ...(activeSubmenu ? [renderBackButton(activeSubmenu.id)] : []),
                          ...cards.filter((card) => isEnabled(card, !!user)).map(renderMenuLink),
                        ]}
                      </NavigationRoot>
                    );
                  }),
              ]}
            </NavigationSection>
          </NavigationBar>
        </AgoraHeader>
        {user && (
          <AdminProfileSwitcher
            headerRef={wrapperRef}
            headerHandleRef={headerRef}
            showActiveProfile={false}
          />
        )}
      </header>
    </>
  );
};
