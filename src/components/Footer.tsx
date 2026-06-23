"use client";

import {
  FinancingSectionContainer,
  Footer as FooterADS,
  FooterDisclaimer,
  FooterGenericLogo,
  FooterLink,
  LinksSectionContainer,
  LinksSectionRelatedLinks,
  LinksSectionRelatedLinksCopyright,
  LinksSectionSocialLinks,
} from "@ama-pt/agora-design-system";
import Link from "next/link";

const linkColumns = [
  {
    title: "Dados abertos",
    links: [
      { href: "/roadmap", label: "Roadmap" },
      { href: "/datasets/catalogo-de-dados-dos-dados-gov-pt", label: "Catálogo de dados" },
      { href: "https://data.europa.eu/pt", label: "Portal de dados europeu" },
    ],
  },
  {
    title: "Portal",
    links: [
      { href: "/posts", label: "Notícias" },
      { href: "/como-usar-o-portal/sobre", label: "Sobre nós" },
      { href: "/support", label: "Ajuda e contactos" },
      { href: "/faqs/terms", label: "Termos de utilização" },
    ],
  },
  {
    title: "Desenvolvimento",
    links: [
      { href: "/docapi", label: "API dos dados.gov.pt" },
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

// Element 1: Links Navigation
const FooterNavigation = () => {
  return (
    <div className="container mx-auto flex flex-col gap-32 py-32 lg:py-64">
      <h3 className="text-l-bold text-white">Mais para descobrir no portal</h3>
      <div className="grid grid-cols-1 gap-32 md:grid-cols-2 lg:grid-cols-3">
        {linkColumns.map((column, idx) => (
          <div key={idx} className="flex flex-col gap-16">
            <h4 className="text-m-semibold text-white">{column.title}</h4>
            <ul className="flex flex-col gap-16">
              {column.links.map((link, linkIdx) => (
                <li key={linkIdx}>
                  <Link
                    href={link.href}
                    className="text-sm text-white transition-colors hover:underline"
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

const FooterBottom = () => {
  return (
    <div className="mx-auto lg:container">
      <FooterADS variant="primary-900">
        <FinancingSectionContainer aria-label="Parceiros do portal">
          <FooterDisclaimer>Portal aberto de dados públicos portugueses</FooterDisclaimer>
          <FooterGenericLogo>
            <img
              src="/Logos/NextGenerationEU.svg"
              alt="NextGenerationEU"
              style={{ height: "24px", width: "auto", opacity: 0.5 }}
            />
          </FooterGenericLogo>
          <FooterGenericLogo>
            <img
              src="/Logos/republica-portuguesa.svg"
              alt="República Portuguesa"
              style={{ height: "24px", width: "auto", opacity: 0.5 }}
            />
          </FooterGenericLogo>
          <FooterGenericLogo>
            <img
              src="/Logos/Logotipo_ARTE__Horizontal_branco_pt.svg"
              alt="ARTE"
              style={{ height: "26px", width: "auto", opacity: 0.5 }}
            />
          </FooterGenericLogo>
        </FinancingSectionContainer>

        <LinksSectionContainer>
          <LinksSectionSocialLinks
            aria-label="Redes sociais"
            className="flex w-full items-center border-t-2 border-t-[#ffffff0d] px-32 py-32 md:px-64 lg:w-1/3 lg:border-t-0 lg:py-initial lg:pl-64 lg:pr-32 xl:pl-112 [&_ul]:flex [&_ul]:flex-row [&_ul]:flex-wrap [&_ul]:gap-8"
          >
            <FooterLink
              hasIcon
              iconOnly
              variant="neutral"
              trailingIcon="agora-line-linkedin"
              trailingIconHover="agora-solid-linkedin"
              trailingIconActive="agora-solid-linkedin"
              aria-label="LinkedIn"
              href="https://www.linkedin.com/company/arte-gov-pt/"
              target="_blank"
            />

            <FooterLink
              hasIcon
              iconOnly
              variant="neutral"
              trailingIcon="/Logos/github.svg"
              trailingIconHover="/Logos/github.svg"
              trailingIconActive="/Logos/github.svg"
              aria-label="Github"
              href="https://github.com/amagovpt/"
              target="_blank"
            />
          </LinksSectionSocialLinks>

          <LinksSectionRelatedLinks
            aria-label="Links externos"
            className="flex flex-1 flex-col items-start gap-32 border-t-2 border-t-[#ffffff0d] px-32 py-32 pl-32 md:px-64 lg:items-end lg:border-t-0 lg:py-64 lg:pl-32 lg:pr-64 xl:pr-112 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-16 [&_ul]:lg:flex-row [&_ul]:lg:flex-wrap [&_ul]:lg:gap-32"
          >
            <FooterLink
              appearance="link"
              variant="neutral"
              href="https://www.portugal.gov.pt/pt/gc25"
              target="_blank"
            >
              República Portuguesa
            </FooterLink>

            <FooterLink
              appearance="link"
              variant="neutral"
              href="https://www.compete2020.gov.pt/"
              target="_blank"
            >
              Compete 2020
            </FooterLink>

            <FooterLink
              appearance="link"
              variant="neutral"
              href="https://portugal2020.pt/"
              target="_blank"
            >
              Portugal 2020
            </FooterLink>

            <FooterLink
              appearance="link"
              variant="neutral"
              href="https://eur-lex.europa.eu/legal-content/PT/LSU/?uri=CELEX:32019L1024"
              target="_blank"
            >
              Comissão Europeia
            </FooterLink>

            <LinksSectionRelatedLinksCopyright>
              © 2026 República Portuguesa. Todos os direitos reservados.
            </LinksSectionRelatedLinksCopyright>
          </LinksSectionRelatedLinks>
        </LinksSectionContainer>
      </FooterADS>
    </div>
  );
};

export const Footer = () => {
  return (
    <footer className="bg-primary-900 text-white">
      <FooterNavigation />
      <FooterBottom />
    </footer>
  );
};
