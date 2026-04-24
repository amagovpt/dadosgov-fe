'use client';

import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import NextImage from 'next/image';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const { user, samlLogin } = useAuth();

  const [ecosystemOpen, setEcosystemOpen] = useState(false);
  const [ecosystemBtnPortalNode, setEcosystemBtnPortalNode] = useState<HTMLLIElement | null>(null);
  const [ecosystemPanelNode, setEcosystemPanelNode] = useState<HTMLDivElement | null>(null);

  React.useEffect(() => {
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
    setEcosystemBtnPortalNode(li);

    // Create panel container appended to body (position: fixed, top set dynamically)
    let panelDiv = document.querySelector(".ecosystem-panel-container") as HTMLDivElement | null;
    if (!panelDiv) {
      panelDiv = document.createElement("div");
      panelDiv.className = "ecosystem-panel-container";
      document.body.appendChild(panelDiv);
    }
    setEcosystemPanelNode(panelDiv);

    return () => {
      panelsList.querySelector(".ecosystem-panel-menu")?.remove();
      setEcosystemBtnPortalNode(null);
      document.querySelector(".ecosystem-panel-container")?.remove();
      setEcosystemPanelNode(null);
    };
  }, []);

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

      // Keep ecosystem button always rightmost
      const ecosystemLi = panelsList.querySelector(".ecosystem-panel-menu");
      if (ecosystemLi) panelsList.appendChild(ecosystemLi);
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
  }, [pathname]);

  // Position ecosystem panel right below the panels-menu bar (covering the nav bar)
  React.useEffect(() => {
    if (!ecosystemOpen || !ecosystemPanelNode) return;
    const panelsMenu = document.querySelector("header.sticky .panels-menu");
    if (panelsMenu) {
      const rect = panelsMenu.getBoundingClientRect();
      ecosystemPanelNode.style.top = `${rect.bottom}px`;
    }
  }, [ecosystemOpen, ecosystemPanelNode]);

  // Force close all menus/panels on any navigation (pathname OR query string change)
  React.useEffect(() => {
    if (headerRef.current?.closeAll) {
      headerRef.current.closeAll();
    }
    setSubmenu(null);
    setEcosystemOpen(false);
  }, [pathname, searchParams]);

  // Mark header when on auth pages so CSS can style the "Autenticar" button
  const isAuthPage = pathname === '/pages/login' || pathname === '/pages/login';

  // Reset submenu when clicking anywhere outside the card grid (.links)
  const handleHeaderClickCapture = React.useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.links')) {
        setSubmenu(null);
      }
      if (!target.closest('li.ecosystem-panel-menu') && !target.closest('.ecosystem-custom-panel')) {
        setEcosystemOpen(false);
      }
    },
    []
  );

  // Apply submenu styles directly on DOM (NavigationRoot doesn't forward className/styles)
  // Only targets the Conhecimento panel via data attribute marker
  React.useEffect(() => {
    const applySubmenuStyles = () => {
      // Clean up any previously modified panel
      const modified = document.querySelector(
        '.navigation-links-layout[data-submenu]'
      ) as HTMLElement | null;
      if (modified) {
        const titleEl = modified.querySelector(':scope > .title') as HTMLElement | null;
        modified.removeAttribute('data-submenu');
        if (titleEl && titleEl.dataset.originalTitle) {
          titleEl.textContent = titleEl.dataset.originalTitle;
          delete titleEl.dataset.originalTitle;
        }
      }

      // Mark the Conhecimento panel and apply submenu title
      const submenuTitles: Record<string, string> = {
        desenvolvimento: 'Desenvolvimento',
        publicacoes: 'Publicações',
      };

      document.querySelectorAll('.navigation-links-layout').forEach((el) => {
        const titleEl = el.querySelector(':scope > .title') as HTMLElement | null;
        if (!titleEl) return;
        const isConhecimento =
          titleEl.textContent === 'Conhecimento' ||
          titleEl.dataset.originalTitle === 'Conhecimento';
        if (!isConhecimento) return;

        const htmlEl = el as HTMLElement;
        htmlEl.setAttribute('data-conhecimento', '');

        if (submenu && submenuTitles[submenu]) {
          htmlEl.setAttribute('data-submenu', submenu);
          titleEl.dataset.originalTitle = 'Conhecimento';
          titleEl.textContent = submenuTitles[submenu];
        }
      });
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(applySubmenuStyles);
    });
  }, [submenu]);

  const ecosystemCol1 = [
    { href: "https://www.gov.pt/", label: "gov.pt", logo: "/Ecossistema/logo_gov.svg", bgColor: "#034AD8" },
    { href: "https://digital.gov.pt/", label: "Digital.gov", logo: "/Ecossistema/digital_gov.svg", bgColor: "#0902A2" },
    { href: "https://mosaico.gov.pt/", label: "Mosaico.gov", logo: "/Ecossistema/mosaico_gov.svg", bgColor: "#0B2C5E" },
    { href: "https://www.autenticacao.gov.pt/", label: "Autenticação.gov", logo: "/Ecossistema/autent_gov.svg", bgColor: "#1A65FA" },
    { href: "https://www.acessibilidade.gov.pt/", label: "Acessibilidade.gov", logo: "/Ecossistema/acessibilidade_gov.svg", bgColor: "#0338A2" },
  ];

  const ecosystemCol2 = [
    { href: "https://www.iap.gov.pt/", label: "Interoperabilidade", logo: "/Ecossistema/iap_gov.svg", bgColor: "#006BE0" },
    { href: "https://participa.gov.pt/base/home", label: "Participa", logo: "/Ecossistema/participa_gov.svg", bgColor: "#092C4C" },
    { href: "https://transparencia.gov.pt/pt", label: "Mais Transparência", logo: "/Ecossistema/transparencia_gov.svg", bgColor: "#FFC200" },
    { href: "https://territoriosinteligentes.gov.pt/", label: "Territórios Inteligentes", logo: "/Ecossistema/territorios_gov.svg", bgColor: "#198656" },
    { href: "https://eavalia.arte.gov.pt/", label: "E-avalia", logo: "/Ecossistema/eavalia_gov.svg", bgColor: "#2B658D" },
  ];

  const artePortals = [
    { href: "https://www.arte.gov.pt/", label: "Portal ARTE" },
    { href: "https://academia.arte.gov.pt/", label: "Academia ARTE" },
    { href: "https://recrutamento.arte.gov.pt/public/recruitment", label: "Recrutamento" },
  ];

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

  type KnowledgeItem =
    | { type: "back"; key: string }
    | {
      type: "card";
      key: string;
      iconDefault: string;
      iconHover?: string;
      title: string;
      description: string;
      href: string;
      isSubmenuTrigger?: boolean;
    };

  const conhecimentoItems: KnowledgeItem[] =
    submenu === "desenvolvimento"
      ? [
        { type: "back", key: "voltar" },
        {
          type: "card",
          key: "dev-api-ref",
          iconDefault: "agora-line-plus-circle",
          iconHover: "agora-solid-plus-circle",
          title: "Documentação da API",
          description: "Documentação técnica",
          href: "/pages/faqs/api-documentation",
        },
      ]
      : submenu === "publicacoes"
        ? [
          { type: "back", key: "voltar" },
          {
            type: "card",
            key: "pub-guias",
            iconDefault: "agora-line-book-open",
            iconHover: "agora-solid-book-open",
            title: "Relatórios/Estudos",
            description: "Relatórios e estudos",
            href: "#",
          },
        ]
        : [
          {
            type: "card",
            key: "dados-gov",
            iconDefault: "agora-line-info-mark",
            iconHover: "agora-solid-info-mark",
            title: "O que é o dados.gov.pt",
            description: "Sobre o portal",
            href: "/pages/faqs/about_dadosgov",
          },
          {
            type: "card",
            key: "publicar",
            iconDefault: "agora-line-info-mark",
            iconHover: "agora-solid-info-mark",
            title: "Publicar dados",
            description: "Guia de publicação",
            href: "/pages/faqs/publish",
          },
          {
            type: "card",
            key: "reutilizar",
            iconDefault: "/Icons/bar_char_white.svg",
            iconHover: "/Icons/bar_char_white.svg",
            title: "Reutilizar dados",
            description: "Guia de reutilização",
            href: "/pages/faqs/reuse",
          },
          {
            type: "card",
            key: "sobre",
            iconDefault: "agora-line-info-mark",
            iconHover: "agora-solid-info-mark",
            title: "Sobre dados abertos",
            description: "Informação geral",
            href: "/pages/about-open-data",
          },
          {
            type: "card",
            key: "desenvolvimento",
            iconDefault: "agora-line-user-group",
            iconHover: "agora-solid-user-group",
            title: "Desenvolvimento",
            description: "Portal e código",
            href: "#",
            isSubmenuTrigger: true,
          },
          // Publicações ocultas temporariamente
          // {
          //   type: "card",
          //   key: "publicacoes",
          //   iconDefault: "agora-line-book-open",
          //   iconHover: "agora-solid-book-open",
          //   title: "Publicações",
          //   description: "Relatórios e estudos",
          //   href: "#",
          //   isSubmenuTrigger: true,
          // },
          // Minicursos ocultos temporariamente
          // {
          //   type: "card",
          //   key: "minicursos",
          //   iconDefault: "agora-line-folder",
          //   iconHover: "agora-solid-folder",
          //   title: "Minicursos",
          //   description: "Formação online",
          //   href: "/pages/mini-courses",
          // },
        ];

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
    <header className="sticky top-0 z-sticky relative" data-auth-page={isAuthPage || undefined} data-no-user={!user || undefined} onClickCapture={handleHeaderClickCapture}>
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
              <div style={{ maxWidth: "40vw" }}>
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
              <Link href={user ? `/pages/users/${user.slug}` : "/pages/login"}>
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
            {conhecimentoItems.map((item) => {

              if (item.type === "back") {

                return (
                  <NavigationLink key={item.key} appearance="link">
                    <div

                      onClickCapture={(e) => {

                        e.stopPropagation();

                        e.preventDefault();

                        setSubmenu(null);

                      }}
                    >
                      <Button

                        appearance="link"

                        hasIcon

                        leadingIcon="agora-line-arrow-left-anchor"

                        leadingIconHover="agora-solid-arrow-left-anchor"

                        className="!text-neutral-900 voltar-btn"
                      >

                        Voltar
                      </Button>
                    </div>
                  </NavigationLink>

                );

              }

              if (item.isSubmenuTrigger) {

                return (
                  <NavigationLink key={item.key} appearance="link">
                    <div

                      role="button"

                      tabIndex={0}

                      onClickCapture={(e) => {

                        e.stopPropagation();

                        e.preventDefault();

                        setSubmenu(item.key);

                      }}

                      onKeyDown={(e) => {

                        if (e.key === "Enter" || e.key === " ") {

                          e.preventDefault();

                          setSubmenu(item.key);

                        }

                      }}

                      className="cursor-pointer"
                    >
                      <HeaderCard

                        iconDefault={item.iconDefault}

                        iconHover={item.iconHover}

                        title={item.title}

                        description={item.description}

                        href={item.href}

                        onLinkClick={(e) => {

                          e.preventDefault();

                          e.stopPropagation();

                          setSubmenu(item.key);

                        }}

                      />
                    </div>
                  </NavigationLink>

                );

              }

              return (
                <NavigationLink key={item.key} appearance="link">
                  <HeaderCard

                    iconDefault={item.iconDefault}

                    iconHover={item.iconHover}

                    title={item.title}

                    description={item.description}

                    href={item.href}

                    onLinkClick={handleLinkClick}

                  />
                </NavigationLink>

              );

            })}

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
    {ecosystemBtnPortalNode && createPortal(
      <>
        <span className="agora-link-wrapper agora-link-wrapper-link-neutral custom-header-link-wrapper panel-menu-link-wrapper inline-flex items-center">
          <a
            className="link-with-icon"
            href="#"
            aria-expanded={ecosystemOpen}
            onClick={(e) => { e.preventDefault(); setEcosystemOpen((o) => !o); }}
          >
            <div className="icon-wrapper leading flex items-center">
              <Icon name="agora-line-dashboard" className="w-24 h-24" />
            </div>
            <span className="children-wrapper">Ecossistema</span>
          </a>
        </span>
        <NextImage
          src="/Ecossistema/arte_black_simple.svg"
          alt="arte.gov.pt"
          width={64}
          height={32}
          className="self-center ml-8"
        />
      </>,
      ecosystemBtnPortalNode
    )}
    {ecosystemPanelNode && ecosystemOpen && createPortal(
      <div className="ecosystem-custom-panel">
        <div className="w-full px-[112px] py-[64px] flex flex-row">
          {/* Left blue vertical divider */}
          <div className="w-[2px] bg-primary-600 self-stretch shrink-0" />

          {/* Main content */}
          <div className="flex flex-col gap-[32px] pl-[32px] flex-1">

            {/* Title + Description */}
            <div className="flex flex-row gap-[32px] items-start">
              <div className="w-[347px] shrink-0">
                <p className="font-medium text-primary-900" style={{ fontSize: '24px', lineHeight: '36px' }}>Ecossistema</p>
                <p className="font-bold text-primary-900" style={{ fontSize: '24px', lineHeight: '36px' }}>ARTE</p>
              </div>
              <p className="text-base text-primary-900 max-w-[488px]">
                Agência para a Reforma Tecnológica do Estado, para a simplificação e digitalização da Administração Pública
              </p>
            </div>

            {/* Portal columns */}
            <div className="flex flex-row gap-[32px]">
              {/* Column 1 */}
              <ul className="flex flex-col gap-[8px]">
                {ecosystemCol1.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-[8px] py-[8px] group"
                    >
                      <div
                        className="shrink-0 w-[32px] h-[32px] rounded-full flex items-center justify-center"
                        style={{ backgroundColor: item.bgColor }}
                      >
                        <div className="relative w-[20px] h-[20px]">
                          <NextImage src={item.logo} alt={item.label} fill className="object-contain" />
                        </div>
                      </div>
                      <span className="text-base font-medium text-[#2B363C] group-hover:text-primary-600">{item.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
              {/* Column 2 */}
              <ul className="flex flex-col gap-[8px]">
                {ecosystemCol2.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-[8px] py-[8px] group"
                    >
                      <div
                        className="shrink-0 w-[32px] h-[32px] rounded-full flex items-center justify-center"
                        style={{ backgroundColor: item.bgColor }}
                      >
                        <div className="relative w-[20px] h-[20px]">
                          <NextImage src={item.logo} alt={item.label} fill className="object-contain" />
                        </div>
                      </div>
                      <span className="text-base font-medium text-[#2B363C] group-hover:text-primary-600">{item.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Horizontal divider */}
            <div className="h-[1px] bg-primary-600" />

            {/* ARTE links */}
            <div className="flex flex-row gap-[32px]">
              {artePortals.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base text-primary-600 underline hover:text-primary-800"
                >
                  {link.label}
                </a>
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
