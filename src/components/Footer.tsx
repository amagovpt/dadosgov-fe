"use client";

import React, { useEffect } from "react";
import { FederatedFooter } from "@ama-pt/agora-design-system";
import Link from "next/link";

const linkColumns = [
  {
    title: "Dados abertos",
    links: [
      { href: "/pages/datasets/catalogo-de-dados-dos-dados-gov-pt", label: "Catálogo dos dados" },
      { href: "https://data.europa.eu/en", label: "Portal de dados europeu" },
    ],
  },
  {
    title: "Portal",
    links: [
      { href: "/pages/posts", label: "Notícias" },
      { href: "/pages/faqs/about_dadosgov", label: "Sobre nós" },
      { href: "/pages/support", label: "Ajuda e contactos" },
      { href: "/pages/faqs/terms", label: "Termos de utilização" },
    ],
  },
  {
    title: "Desenvolvimento",
    links: [
      { href: "/pages/docapi", label: "API dos dados.gov.pt" },
      {
        href: "https://github.com/amagovpt/udata-pt",
        label: `Mecanismo de código aberto : udata (${process.env.NEXT_PUBLIC_UDATA_VERSION && process.env.NEXT_PUBLIC_UDATA_VERSION !== "unknown" ? process.env.NEXT_PUBLIC_UDATA_VERSION : "10.4.3"})`,
      },
      {
        href: "https://github.com/amagovpt/dadosgov-fe",
        label: `Extensão do tema udata : udata-front${process.env.NEXT_PUBLIC_UDATA_FRONT_VERSION && process.env.NEXT_PUBLIC_UDATA_FRONT_VERSION !== "unknown" ? ` (${process.env.NEXT_PUBLIC_UDATA_FRONT_VERSION})` : ""}`,
      },
    ],
  },
];

const socialLinksData = [
  {
    icon: "agora-line-linkedin",
    iconHover: "agora-solid-linkedin",
    href: "https://www.linkedin.com/company/arte-gov-pt/",
    label: "LinkedIn",
  },
];

const usefulLinksData = [
  { href: "https://www.portugal.gov.pt/pt/gc25", label: "República Portuguesa" },
  { href: "https://www.compete2020.gov.pt/", label: "Compete 2020" },
  { href: "https://portugal2020.pt/", label: "Portugal 2020" },
  {
    href: "https://eur-lex.europa.eu/legal-content/PT/LSU/?uri=CELEX:32019L1024",
    label: "Comissão Europeia",
  },
];

// Element 1: Links Navigation
const FooterNavigation = () => {
  return (
    <div className="flex flex-col gap-32 container mx-auto py-16 xl:py-64">
      <h3 className="text-l-bold text-white">Mais para descobrir no portal</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-32">
        {linkColumns.map((column, idx) => (
          <div key={idx} className="flex flex-col gap-16">
            <h4 className="text-m-semibold text-white">{column.title}</h4>
            <ul className="flex flex-col gap-16">
              {column.links.map((link, linkIdx) => (
                <li key={linkIdx}>
                  <Link
                    href={link.href}
                    className="text-white hover:underline text-sm transition-colors"
                    {...(link.href.startsWith("http")
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export const Footer = () => {
  const footerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;
    const socialUl = footer.querySelector("nav.flex.items-center.justify-center ul");
    if (!socialUl) return;
    const existingGithub = socialUl.querySelector('[aria-label="GitHub"]');
    if (existingGithub) return;
    const li = document.createElement("li");
    li.className = "flex items-center";
    const githubLink = document.createElement("a");
    githubLink.href = "https://github.com/amagovpt/";
    githubLink.target = "_blank";
    githubLink.rel = "noopener noreferrer";
    githubLink.setAttribute("aria-label", "GitHub");
    githubLink.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.416 22 12c0-5.523-4.477-10-10-10z"/></svg>`;
    li.appendChild(githubLink);
    socialUl.appendChild(li);
  }, []);

  return (
    <footer className="bg-primary-900 text-white" ref={footerRef}>
      <FooterNavigation />
      <FederatedFooter
        darkMode={true}
        brandImage={{
          image: {
            src: "/Logos/logo.svg",
            alt: "dados.gov.pt",
            style: { height: "43px", width: "auto" },
          },
        }}
        caption="Portal aberto de dados públicos portugueses"
        partnersLogos={[
          {
            image: {
              src: "/Logos/NextGenerationEU.svg",
              alt: "NextGenerationEU",
              style: { height: "24px", width: "auto", opacity: 0.5 },
            },
          },
          {
            image: {
              src: "/Logos/republica-portuguesa.svg",
              alt: "República Portuguesa",
              style: { height: "24px", width: "auto", opacity: 0.5 },
            },
          },
          {
            image: {
              src: "/Logos/Logotipo_ARTE__Horizontal_branco_pt.svg",
              alt: "ARTE",
              style: { height: "24px", width: "auto", opacity: 0.5 },
            },
          },
        ]}
        socialsLink={socialLinksData.map((s) => ({
          icon: s.icon,
          iconHover: s.iconHover,
          link: {
            href: s.href,
            "aria-label": s.label,
            target: "_blank",
            rel: "noopener noreferrer",
          },
        }))}
        usefulLinks={usefulLinksData.map((l) => ({
          href: l.href,
          target: "_blank",
          rel: "noopener noreferrer",
          children: l.label,
        }))}
        copyright="© 2022 República Portuguesa. Todos os direitos reservados."
      />
    </footer>
  );
};
