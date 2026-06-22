"use client";

import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import NextImage from "next/image";
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
} from "@ama-pt/agora-design-system";
import SearchDropdown from "@/components/search/SearchDropdown";
import { HeaderCard } from "@/components/HeaderCard";
import { useAuth } from "@/context/AuthContext";
import { logout } from "@/service/api/auth";
import TextLink from "@/components/Primitives/TextLink";

export const Header = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const headerRef = useRef<any>(null);
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
    const submenuTitles: Record<string, string> = {
      desenvolvimento: "Desenvolvimento",
      publicacoes: "Publicações",
      "usar-dados": "Como usar o portal",
    };
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
  }, [submenu]);

  const ecosystemCol1 = [
    {
      href: "https://www.gov.pt/",
      label: "gov.pt",
      logo: "/Ecossistema/logo_gov.svg",
      bgColor: "#034AD8",
    },
    {
      href: "https://digital.gov.pt/",
      label: "Digital.gov",
      logo: "/Ecossistema/digital_gov.svg",
      bgColor: "#0902A2",
    },
    {
      href: "https://mosaico.gov.pt/",
      label: "Mosaico.gov",
      logo: "/Ecossistema/mosaico_gov.svg",
      bgColor: "#0B2C5E",
    },
    {
      href: "https://www.autenticacao.gov.pt/",
      label: "Autenticação.gov",
      logo: "/Ecossistema/autent_gov.svg",
      bgColor: "#1A65FA",
    },
    {
      href: "https://www.acessibilidade.gov.pt/",
      label: "Acessibilidade.gov",
      logo: "/Ecossistema/acessibilidade_gov.svg",
      bgColor: "#0338A2",
    },
  ];

  const ecosystemCol2 = [
    {
      href: "https://www.iap.gov.pt/",
      label: "Interoperabilidade",
      logo: "/Ecossistema/iap_gov.svg",
      bgColor: "#006BE0",
    },
    {
      href: "https://participa.gov.pt/base/home",
      label: "Participa",
      logo: "/Ecossistema/participa_gov.svg",
      bgColor: "#092C4C",
    },
    {
      href: "https://transparencia.gov.pt/pt",
      label: "Mais Transparência",
      logo: "/Ecossistema/transparencia_gov.svg",
      bgColor: "#FFC200",
    },
    {
      href: "https://territoriosinteligentes.gov.pt/",
      label: "Territórios Inteligentes",
      logo: "/Ecossistema/territorios_gov.svg",
      bgColor: "#198656",
    },
    {
      href: "https://eavalia.arte.gov.pt/",
      label: "E-avalia",
      logo: "/Ecossistema/eavalia_gov.svg",
      bgColor: "#2B658D",
    },
  ];

  const artePortals = [
    { href: "https://www.arte.gov.pt/", label: "Portal ARTE" },
    { href: "https://academia.arte.gov.pt/", label: "Academia ARTE" },
    { href: "https://recrutamento.arte.gov.pt/public/recruitment", label: "Recrutamento" },
  ];

  const languages = [
    { value: "pt", label: "Português", abbr: "PT" },
    { value: "en", label: "English", abbr: "EN" },
    { value: "es", label: "Español", abbr: "ES" },
    { value: "fr", label: "Français", abbr: "FR" },
  ];

  const areas = [
    { value: "1", label: "Portal" },
    { value: "2", label: "Iniciar Sessão" },
  ];

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
                <NextImage
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
              onChange={() => {}}
            >
              <Area
                value="1"
                label="Portal"
                onClick={() => router.push("/")}
                active={selectedArea === "1"}
              />
              <div className="hidden">
                <Area
                  value="2"
                  label="Iniciar Sessão"
                  onClick={() => router.push("/login")}
                  active={selectedArea === "2"}
                />
              </div>
            </Areas>

            <Languages
              aria-label="Selecionar idioma"
              // @ts-expect-error - Prop label does exist in component logic
              label={currentLangLabel}
              onChange={(lang: string) => setSelectedLanguage(lang)}
            >
              <Language
                value="pt"
                label="Português"
                abbr="PT"
                checked={selectedLanguage === "pt"}
              />
              <Language value="en" label="English" abbr="EN" checked={selectedLanguage === "en"} />
              <Language value="es" label="Español" abbr="ES" checked={selectedLanguage === "es"} />
              <Language value="fr" label="Français" abbr="FR" checked={selectedLanguage === "fr"} />
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
            <NavigationLink appearance="link">
              <Link
                href="/datastories"
                onClick={(e) => handleLinkClick(e, "/datastories")}
              >
                Data Stories
              </Link>
            </NavigationLink>

            <NavigationLink appearance="link">
              <Link href="/datasets" onClick={(e) => handleLinkClick(e, "/datasets")}>
                Conjuntos de dados
              </Link>
            </NavigationLink>

            {/* API (dataservices) oculta temporariamente — feature incompleta para PRD
            <NavigationLink appearance="link">
              <Link
                href="/dataservices"
                onClick={(e) => handleLinkClick(e, "/dataservices")}
              >
                API
              </Link>
            </NavigationLink>
            */}

            <NavigationLink appearance="link">
              <Link href="/reuses" onClick={(e) => handleLinkClick(e, "/reuses")}>
                Reutilizações
              </Link>
            </NavigationLink>

            <NavigationLink appearance="link">
              <Link
                href="/organizations"
                onClick={(e) => handleLinkClick(e, "/organizations")}
              >
                Organizações
              </Link>
            </NavigationLink>

            <NavigationRoot label="Recursos">
              {/* Main menu items — always in DOM, hidden via CSS when a submenu is active */}
              <NavigationLink appearance="link">
                <div
                  data-group="main"
                  role="button"
                  tabIndex={0}
                  onClickCapture={(e) => {
                    e.preventDefault();
                    setSubmenu("usar-dados");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSubmenu("usar-dados");
                    }
                  }}
                  className="cursor-pointer"
                >
                  <HeaderCard
                    iconDefault="/Icons/bar_char_white.svg"
                    iconHover="/Icons/bar_char_white.svg"
                    title="Como usar o portal"
                    description="Explorar e reutilizar"
                    href="#"
                    onLinkClick={handleLinkClick}
                  />
                </div>
              </NavigationLink>

              {/* Usar dados submenu items — hidden by default, shown via CSS */}
              <NavigationLink appearance="link">
                <div data-group="submenu-usar-dados" data-is-back="true">
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
                <div data-group="submenu-usar-dados">
                  <HeaderCard
                    iconDefault="agora-line-info-mark"
                    iconHover="agora-solid-info-mark"
                    title="O que é o dados.gov.pt"
                    description="Sobre o portal"
                    href="/faqs/about_dadosgov"
                    onLinkClick={handleLinkClick}
                  />
                </div>
              </NavigationLink>
              <NavigationLink appearance="link">
                <div data-group="submenu-usar-dados">
                  <HeaderCard
                    iconDefault="agora-line-globe"
                    iconHover="agora-solid-globe"
                    title="Sobre dados abertos"
                    description="Informação geral"
                    href="/about-open-data"
                    onLinkClick={handleLinkClick}
                  />
                </div>
              </NavigationLink>
              <NavigationLink appearance="link">
                <div data-group="submenu-usar-dados">
                  <HeaderCard
                    iconDefault="agora-line-upload"
                    iconHover="agora-solid-upload"
                    title="Como publicar dados"
                    description="Guia de publicação"
                    href="/faqs/publish"
                    onLinkClick={handleLinkClick}
                  />
                </div>
              </NavigationLink>
              <NavigationLink appearance="link">
                <div data-group="submenu-usar-dados">
                  <HeaderCard
                    iconDefault="agora-line-refresh-ccw"
                    iconHover="agora-solid-refresh-ccw"
                    title="Como reutilizar dados"
                    description="Guia de reutilização"
                    href="/faqs/reuse"
                    onLinkClick={handleLinkClick}
                  />
                </div>
              </NavigationLink>
              <NavigationLink appearance="link">
                <div data-group="submenu-usar-dados">
                  <HeaderCard
                    iconDefault="agora-line-shield"
                    iconHover="agora-solid-shield"
                    title="Licenças"
                    description="Licenças de dados abertos"
                    href="/faqs/licenses"
                    onLinkClick={handleLinkClick}
                  />
                </div>
              </NavigationLink>

              <NavigationLink appearance="link">
                <div data-group="main">
                  <HeaderCard
                    iconDefault="agora-line-book-open"
                    iconHover="agora-solid-book-open"
                    title="Aprender"
                    description="Cursos e Minicursos"
                    href="/learn"
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
                    iconDefault="agora-line-plane"
                    iconHover="agora-solid-plane"
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
                    iconDefault="agora-line-document"
                    iconHover="agora-solid-document"
                    title="Acesso via SPARQL"
                    description="Consultar o catálogo via SPARQL"
                    href="/faqs/acesso-ao-catalogo-via-sparql"
                    onLinkClick={handleLinkClick}
                  />
                </div>
              </NavigationLink>
              <NavigationLink appearance="link">
                <div data-group="submenu-desenvolvimento">
                  <HeaderCard
                    iconDefault="agora-line-book-open"
                    iconHover="agora-solid-book-open"
                    title="Tutorial API"
                    description="Guia de utilização da API"
                    href="/faqs/api-tutorial"
                    onLinkClick={handleLinkClick}
                  />
                </div>
              </NavigationLink>
              <NavigationLink appearance="link">
                <div data-group="submenu-desenvolvimento">
                  <HeaderCard
                    iconDefault="/Icons/reduce_icon.svg"
                    iconHover="/Icons/reduce_icon.svg"
                    title="Referência API"
                    description="Documentação técnica"
                    href="/faqs/api-documentation"
                    onLinkClick={handleLinkClick}
                  />
                </div>
              </NavigationLink>
              {/* hidden: publicações
              <NavigationLink appearance="link">
                <div data-group="main">
                  <HeaderCard
                    iconDefault="agora-line-mega-phone"
                    iconHover="agora-solid-mega-phone"
                    title="Publicações"
                    description="Novidades e eventos"
                    href="/publications"
                    onLinkClick={handleLinkClick}
                  />
                </div>
              </NavigationLink>
              */}
            </NavigationRoot>

            <NavigationRoot label="Publicar">
              {[
                {
                  iconDefault: "agora-line-layers-menu",
                  iconHover: "agora-solid-layers-menu",
                  title: "Novo Conjunto de Dados",
                  description: "Publicar dados",
                  href: "/admin/datasets/new",
                },
                // Nova API (dataservices) oculta temporariamente — feature incompleta para PRD
                // {
                //   iconDefault: "/Icons/api.svg",
                //   iconHover: "/Icons/api-solid.svg",
                //   title: "Nova API",
                //   description: "Serviços de dados",
                //   href: "/admin/dataservices/new",
                // },
                {
                  iconDefault: "agora-line-share",
                  iconHover: "agora-solid-share",
                  title: "Nova Reutilização",
                  description: "Casos de uso",
                  href: "/admin/reuses/new",
                },
                {
                  iconDefault: "agora-line-buildings",
                  iconHover: "agora-solid-buildings",
                  title: "Nova Organização",
                  description: "Entidades",
                  href: "/admin/organizations/new?step=1",
                },
                {
                  iconDefault: "/Icons/harvester.svg",
                  iconHover: "/Icons/harvester-solid.svg",
                  title: "Novo Harvester",
                  description: "Recolha automática",
                  href: "/admin/harvesters/new",
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
      {adminPortalNode &&
        createPortal(
          <div className="panel-menu unauthenticated-panel-menu">
            <span className="agora-link-wrapper agora-link-wrapper-link-neutral full-width custom-header-link-wrapper panel-menu-link-wrapper inline-flex min-h-[44px] min-w-[44px] items-center justify-center py-8">
              <Link className="link-with-icon" href="/admin/me/datasets">
                <div className="icon-wrapper leading">
                  <Icon name="agora-line-hardware-settings" dimensions="s" />
                </div>
                <span className="children-wrapper">Administração</span>
              </Link>
            </span>
          </div>,
          adminPortalNode
        )}
      {logoutPortalNode &&
        createPortal(
          <div className="panel-menu unauthenticated-panel-menu">
            <span className="agora-link-wrapper agora-link-wrapper-link-neutral full-width custom-header-link-wrapper panel-menu-link-wrapper inline-flex min-h-[44px] min-w-[44px] items-center justify-center py-8">
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
                  <Icon name="agora-line-log-out" dimensions="s" />
                </div>
                <span className="children-wrapper">Sair</span>
              </a>
            </span>
          </div>,
          logoutPortalNode
        )}
      {ecosystemBtnPortalNode &&
        createPortal(
          <>
            <span className="agora-link-wrapper agora-link-wrapper-link-neutral custom-header-link-wrapper panel-menu-link-wrapper inline-flex items-center">
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
              </a>
            </span>
            <NextImage
              src="/Ecossistema/arte_black_simple.svg"
              alt="arte.gov.pt"
              width={170}
              height={64}
              className="-ml-4 h-[12px] w-auto self-center"
            />
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
                    Agência para a Reforma Tecnológica do Estado, para a simplificação e
                    digitalização da Administração Pública
                  </p>
                </div>
                <div className="flex flex-row gap-32">
                  <ul className="flex flex-col gap-8">
                    {ecosystemCol1.map((item) => (
                      <li key={item.href}>
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-8 py-8"
                        >
                          <div
                            className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full"
                            style={{ backgroundColor: item.bgColor }}
                          >
                            <div className="relative h-[20px] w-[20px]">
                              <NextImage
                                src={item.logo}
                                alt={item.label}
                                fill
                                className="object-contain"
                              />
                            </div>
                          </div>
                          <span className="text-base font-medium text-[#2B363C] group-hover:text-primary-600">
                            {item.label}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                  <ul className="flex flex-col gap-8">
                    {ecosystemCol2.map((item) => (
                      <li key={item.href}>
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-8 py-8"
                        >
                          <div
                            className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full"
                            style={{ backgroundColor: item.bgColor }}
                          >
                            <div className="relative h-[20px] w-[20px]">
                              <NextImage
                                src={item.logo}
                                alt={item.label}
                                fill
                                className="object-contain"
                              />
                            </div>
                          </div>
                          <span className="text-base font-medium text-[#2B363C] group-hover:text-primary-600">
                            {item.label}
                          </span>
                        </a>
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
