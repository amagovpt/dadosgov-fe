'use client';

import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import NextImage from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
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
} from '@ama-pt/agora-design-system';
import SearchDropdown from '@/components/search/SearchDropdown';
import { HeaderCard } from '@/components/HeaderCard';
import { useAuth } from '@/context/AuthContext';
import { logout } from '@/services/api';

export const Header = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const headerRef = useRef<any>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { user, samlLogin } = useAuth();

  // Create DOM nodes for "Administração" and "Desconectar" portals
  const [adminPortalNode, setAdminPortalNode] = useState<HTMLLIElement | null>(null);
  const [logoutPortalNode, setLogoutPortalNode] = useState<HTMLLIElement | null>(null);
  React.useEffect(() => {
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
      setAdminPortalNode(adminLi);

      // Desconectar portal
      let logoutLi = panelsList.querySelector(".logout-panel-menu") as HTMLLIElement | null;
      if (!logoutLi) {
        logoutLi = document.createElement("li");
        logoutLi.className = "logout-panel-menu";
        panelsList.appendChild(logoutLi);
      }
      setLogoutPortalNode(logoutLi);
    } else {
      const existingAdmin = panelsList.querySelector(".admin-panel-menu");
      if (existingAdmin) existingAdmin.remove();
      setAdminPortalNode(null);

      const existingLogout = panelsList.querySelector(".logout-panel-menu");
      if (existingLogout) existingLogout.remove();
      setLogoutPortalNode(null);
    }

    return () => {
      panelsList.querySelector(".admin-panel-menu")?.remove();
      setAdminPortalNode(null);
      panelsList.querySelector(".logout-panel-menu")?.remove();
      setLogoutPortalNode(null);
    };
  }, [user]);

  const [selectedLanguage, setSelectedLanguage] = useState('pt');
  const [submenu, setSubmenu] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState(
    pathname === '/pages/login' || pathname === '/pages/login' ? '2' : '1'
  );
  React.useEffect(() => {
    if (pathname === '/pages/login' || pathname === '/pages/login') {
      setSelectedArea('2');
    } else {
      setSelectedArea('1');
    }

    // Force close all menus/panels on route change via design system API
    if (headerRef.current?.closeAll) {
      headerRef.current.closeAll();
    }
    setSubmenu(null);
  }, [pathname]);

  // Mark header when on auth pages so CSS can style the "Autenticar" button
  const isAuthPage = pathname === '/pages/login' || pathname === '/pages/login';

  // Reset submenu when clicking anywhere outside the card grid (.links)
  const handleHeaderClickCapture = React.useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.links')) {
        setSubmenu(null);
      }
    },
    []
  );

  React.useLayoutEffect(() => {
    const submenuTitles: Record<string, string> = {
      desenvolvimento: 'Desenvolvimento',
      publicacoes: 'Publicações',
    };
    const titleEl = document.querySelector(
      '.agora-header .navigation-links-layout > .title'
    ) as HTMLElement | null;
    if (!titleEl) return;
    if (submenu && submenuTitles[submenu]) {
      if (!titleEl.dataset.originalTitle) {
        titleEl.dataset.originalTitle = titleEl.textContent || 'Conhecimento';
      }
      titleEl.textContent = submenuTitles[submenu];
    } else if (titleEl.dataset.originalTitle) {
      titleEl.textContent = titleEl.dataset.originalTitle;
      delete titleEl.dataset.originalTitle;
    }
  }, [submenu]);

  const languages = [
    { value: 'pt', label: 'Português', abbr: 'PT' },
    { value: 'en', label: 'English', abbr: 'EN' },
    { value: 'es', label: 'Español', abbr: 'ES' },
    { value: 'fr', label: 'Français', abbr: 'FR' },
  ];

  const areas = [
    { value: '1', label: 'Portal' },
    { value: '2', label: 'Iniciar Sessão' },
  ];

  const currentLangLabel =
    languages.find((l) => l.value === selectedLanguage)?.label || 'Português';
  const currentAreaLabel =
    areas.find((a) => a.value === selectedArea)?.label || 'Portal';


  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Close all menus/panels via design system API
    if (headerRef.current?.closeAll) {
      headerRef.current.closeAll();
    }
    setSubmenu(null);

    if (href !== '#') {
      router.push(href);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-sticky" data-submenu={submenu ?? undefined} data-auth-page={isAuthPage || undefined} data-no-user={!user || undefined} onClickCapture={handleHeaderClickCapture}>
        <AgoraHeader ref={headerRef} maxNavigationItems={6}>
          <Brand>
            <Logo>
              <Link href="/" className="flex items-center">
                <NextImage
                  src="/Logos/logo.svg"
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
              // @ts-ignore - Prop label does exist in component logic
              label={currentAreaLabel}
              onChange={(area: string) => setSelectedArea(area)}
            >
              <Area
                value="1"
                label="Portal"
                onClick={() => router.push('/')}
                active={selectedArea === '1'}
              />
              <div className="hidden">
                <Area
                  value="2"
                  label="Iniciar Sessão"
                  onClick={() => router.push('/pages/login')}
                  active={selectedArea === '2'}
                />
              </div>
            </Areas>

            <Languages
              aria-label="Selecionar idioma"
              // @ts-ignore - Prop label does exist in component logic
              label={currentLangLabel}
              onChange={(lang: string) => setSelectedLanguage(lang)}
            >
              <Language
                value="pt"
                label="Português"
                abbr="PT"
                checked={selectedLanguage === 'pt'}
              />
              <Language
                value="en"
                label="English"
                abbr="EN"
                checked={selectedLanguage === 'en'}
              />
              <Language
                value="es"
                label="Español"
                abbr="ES"
                checked={selectedLanguage === 'es'}
              />
              <Language
                value="fr"
                label="Français"
                abbr="FR"
                checked={selectedLanguage === 'fr'}
              />
            </Languages>

            <Search label="Pesquisar">
              <CustomSearch>
                <div className='max-w-xl'>
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
                      ? `/pages/users/${user.slug}`
                      : `/pages/login${pathname && pathname !== "/pages/login" ? `?next=${encodeURIComponent(pathname)}` : ""}`
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
            <NavigationLink appearance="link">
              <Link href="/pages/datastories" onClick={(e) => handleLinkClick(e, '/pages/datastories')}>
                Data Stories
              </Link>
            </NavigationLink>

            <NavigationLink appearance="link">
              <Link href="/pages/datasets" onClick={(e) => handleLinkClick(e, '/pages/datasets')}>
                Conjuntos de dados
              </Link>
            </NavigationLink>

            <NavigationLink appearance="link">
              <Link href="/pages/reuses" onClick={(e) => handleLinkClick(e, '/pages/reuses')}>
                Reutilizações
              </Link>
            </NavigationLink>

            <NavigationLink appearance="link">
              <Link href="/pages/organizations" onClick={(e) => handleLinkClick(e, '/pages/organizations')}>
                Organizações
              </Link>
            </NavigationLink>

            <NavigationRoot label="Conhecimento">
              {/* Main menu items — always in DOM, hidden via CSS when a submenu is active */}
              <NavigationLink appearance="link">
                <div data-group="main">
                  <HeaderCard
                    iconDefault="agora-line-info-mark"
                    iconHover="agora-solid-info-mark"
                    title="O que é o dados.gov.pt"
                    description="Sobre o portal"
                    href="/pages/faqs/about_dadosgov"
                    onLinkClick={handleLinkClick}
                  />
                </div>
              </NavigationLink>
              <NavigationLink appearance="link">
                <div data-group="main">
                  <HeaderCard
                    iconDefault="agora-line-info-mark"
                    iconHover="agora-solid-info-mark"
                    title="Publicar dados"
                    description="Guia de publicação"
                    href="/pages/faqs/publish"
                    onLinkClick={handleLinkClick}
                  />
                </div>
              </NavigationLink>
              <NavigationLink appearance="link">
                <div data-group="main">
                  <HeaderCard
                    iconDefault="/Icons/bar_char_white.svg"
                    iconHover="/Icons/bar_char_white.svg"
                    title="Reutilizar dados"
                    description="Guia de reutilização"
                    href="/pages/faqs/reuse"
                    onLinkClick={handleLinkClick}
                  />
                </div>
              </NavigationLink>
              <NavigationLink appearance="link">
                <div data-group="main">
                  <HeaderCard
                    iconDefault="agora-line-info-mark"
                    iconHover="agora-solid-info-mark"
                    title="Sobre dados abertos"
                    description="Informação geral"
                    href="/pages/about-open-data"
                    onLinkClick={handleLinkClick}
                  />
                </div>
              </NavigationLink>
              <NavigationLink appearance="link">
                <div
                  data-group="main"
                  role="button"
                  tabIndex={0}
                  onClickCapture={(e) => {
                    e.preventDefault();
                    setSubmenu("desenvolvimento");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSubmenu("desenvolvimento");
                    }
                  }}
                  className="cursor-pointer"
                >
                  <HeaderCard
                    iconDefault="agora-line-user-group"
                    iconHover="agora-solid-user-group"
                    title="Desenvolvimento"
                    description="Portal e código"
                    href="#"
                    onLinkClick={handleLinkClick}
                  />
                </div>
              </NavigationLink>

              {/* Desenvolvimento submenu items — hidden by default, shown via CSS */}
              <NavigationLink appearance="link">
                <div data-group="submenu-desenvolvimento" data-is-back="true">
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
              <NavigationLink appearance="link">
                <div data-group="submenu-desenvolvimento">
                  <HeaderCard
                    iconDefault="agora-line-plus-circle"
                    iconHover="agora-solid-plus-circle"
                    title="Documentação da API"
                    description="Documentação técnica"
                    href="/pages/faqs/api-documentation"
                    onLinkClick={handleLinkClick}
                  />
                </div>
              </NavigationLink>
              <NavigationLink appearance="link">
                <div data-group="main">
                  <HeaderCard
                    iconDefault="agora-line-edit"
                    iconHover="agora-solid-edit"
                    title="Aprender"
                    description="Cursos e Minicursos"
                    href="/pages/courses"
                    onLinkClick={handleLinkClick}
                  />
                </div>
              </NavigationLink>
            </NavigationRoot>

            <NavigationRoot label="Publicar">
              {[
                {
                  iconDefault: "agora-line-layers-menu",
                  iconHover: "agora-solid-layers-menu",
                  title: "Novo Conjunto de Dados",
                  description: "Publicar dados",
                  href: "/pages/admin/datasets/new",
                },
                {
                  iconDefault: "/Icons/bar_char_white.svg",
                  iconHover: "/Icons/bar_char_white.svg",
                  title: "Nova Reutilização",
                  description: "Casos de uso",
                  href: "/pages/admin/reuses/new",
                },
                {
                  iconDefault: "agora-line-buildings",
                  iconHover: "agora-solid-buildings",
                  title: "Nova Organização",
                  description: "Entidades",
                  href: "/pages/admin/organizations/new?step=1",
                },
                {
                  iconDefault: "/Icons/harvester.svg",
                  iconHover: "/Icons/harvester-solid.svg",
                  title: "Novo Harvester",
                  description: "Recolha automática",
                  href: "/pages/admin/harvesters/new",
                },
              ].map((card) => (
                <NavigationLink key={card.title} appearance="link">
                  <HeaderCard {...card} onLinkClick={handleLinkClick} />
                </NavigationLink>
              ))}
            </NavigationRoot>
          </NavigationBar>
        </AgoraHeader>
      </header>
      {adminPortalNode && createPortal(
        <div className="panel-menu unauthenticated-panel-menu">
          <span className="agora-link-wrapper agora-link-wrapper-link-neutral full-width inline-flex items-center justify-center min-h-[44px] min-w-[44px] py-8 custom-header-link-wrapper panel-menu-link-wrapper">
            <Link
              className="link-with-icon"
              href="/pages/admin/me/datasets"
            >
              <div className="icon-wrapper leading">
                <Icon name="agora-line-hardware-settings" dimensions="s" />
              </div>
              <span className="children-wrapper">Administração</span>
            </Link>
          </span>
        </div>,
        adminPortalNode
      )}
      {logoutPortalNode && createPortal(
        <div className="panel-menu unauthenticated-panel-menu">
          <span className="agora-link-wrapper agora-link-wrapper-link-neutral full-width inline-flex items-center justify-center min-h-[44px] min-w-[44px] py-8 custom-header-link-wrapper panel-menu-link-wrapper">
            <a
              className="link-with-icon"
              href="#"
              onClick={async (e) => {
                e.preventDefault();
                if (samlLogin) {
                  window.location.href = "/saml/logout";
                  return;
                }
                await logout();
                window.location.href = "/";
              }}
            >
              <div className="icon-wrapper leading">
                <Icon name="agora-line-log-out" dimensions="s" />
              </div>
              <span className="children-wrapper">Sair</span>
            </a>
          </span>
        </div>,
        logoutPortalNode
      )}
    </>
  );
};
