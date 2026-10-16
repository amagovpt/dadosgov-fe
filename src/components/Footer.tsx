"use client";

import { Footer as FooterType } from "@/service/types/header/footer";
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
  LinksSectionSocialLinksLabel,
  LogoSectionContainer,
  LogoSectionMainLogo,
} from "@ama-pt/agora-design-system";
import Image from "next/image";
import { useLocalizedHref } from "@/hooks/useLocalizedHref";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { getAssets } from "@/utils/getAssets";
import Anchor from "./Shared/Anchor";

// -------------------------------------------------------------------------------------------------------------------

export type FooterI = {
  data: FooterType;
};

export type FooterNavigationI = {
  title: FooterI["data"]["title"];
  groups: FooterI["data"]["groups"];
};

export type FooterBottomI = {
  description: FooterI["data"]["description"];
  logos: FooterI["data"]["logos"];
  social: FooterI["data"]["social"];
  related: FooterI["data"]["related"];
  copyright: FooterI["data"]["copyright"];
};

// -------------------------------------------------------------------------------------------------------------------

const isExternal = (href: string) => href.startsWith("http");

// The DS Footer v2 has no navigation slot (it renders only its Logo, Financing and Links
// sections), so the link groups sit above it. Outside <FooterADS> the FooterContext
// defaults to a light background, hence the explicit `darkMode` on each FooterLink.
const FooterNavigation = ({ title, groups }: FooterNavigationI) => {
  const localize = useLocalizedHref();

  return (
    <div className="footer-navigation flex flex-col gap-32 px-32 py-32 md:px-64 xl:py-64">
      <h3 className="text-l-bold text-white">{title}</h3>
      <div className="grid grid-cols-1 gap-32 md:grid-cols-2 xl:grid-cols-3">
        {groups
          ?.filter((g) => g.enabled === true)
          ?.map((group, idx) => (
            <div key={idx} className="flex flex-col gap-16">
              <h4 className="text-m-semibold text-white">{group.label}</h4>
              <ul className="flex flex-col">
                {group.cards
                  ?.filter((l) => l.enabled === true)
                  ?.map((link, linkIdx) => (
                    <FooterLink
                      key={linkIdx}
                      appearance="link"
                      variant="neutral"
                      darkMode
                      href={isExternal(link.href) ? link.href : localize(link.href)}
                      {...(isExternal(link.href)
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      {link.title}
                    </FooterLink>
                  ))}
              </ul>
            </div>
          ))}
      </div>
    </div>
  );
};

// -------------------------------------------------------------------------------------------------------------------

const FooterBottom = ({ description, logos, social, related, copyright }: FooterBottomI) => {
  const { t } = useTranslation("footer");

  const logoSectionContent = [
    <LogoSectionMainLogo key="footer-main-logo">
      <Image
        src={"/Logos/pt-republic-color.svg"}
        alt="Agora"
        height={48}
        width={160}
        className="h-40 w-auto object-contain md:h-48"
      />
    </LogoSectionMainLogo>,
    <FooterGenericLogo key="footer-arte-logo">
      <Image
        src={"/Logos/Logotipo_ARTE__Horizontal_branco_pt.svg"}
        alt="Agora"
        height={48}
        width={160}
        className="h-40 w-auto object-contain md:h-48"
      />
    </FooterGenericLogo>,
  ];

  const financingSectionContent = [
    <FooterDisclaimer key="footer-description">{description}</FooterDisclaimer>,
    ...(logos?.map((logo, index) => (
      <FooterGenericLogo key={`footer-logo-${index}`}>
        <Anchor className="flex items-center gap-8" href={logo.href} target="_blank">
          <Image
            src={getAssets(logo.image[0].slug)}
            alt={logo.alt}
            height={26}
            width={100}
            className="object-fill opacity-50 transition-opacity hover:opacity-100 "
          />
        </Anchor>
      </FooterGenericLogo>
    )) ?? []),
  ];

  const linksSectionSocialContent = [
    <LinksSectionSocialLinksLabel key="footer-social-label">
      {t("socialLabel")}
    </LinksSectionSocialLinksLabel>,
    ...(social?.map((s, index) => {
      const iconName = s.icon.startsWith("agora-") ? s.icon : `/Logos/${s.icon}.svg`;
      return (
        <FooterLink
          key={`footer-social-link-${index}`}
          hasIcon
          iconOnly
          variant="neutral"
          trailingIcon={iconName}
          trailingIconHover={iconName}
          trailingIconActive={iconName}
          aria-label={s.alt}
          href={s.href}
          target="_blank"
        />
      );
    }) ?? []),
  ] as ComponentProps<typeof LinksSectionSocialLinks>["children"];

  const linksSectionRelatedContent = [
    ...(related?.map((r, index) => (
      <FooterLink
        key={`footer-related-links-${index}`}
        appearance="link"
        variant="neutral"
        href={r.href}
        target="_blank"
      >
        {r.children}
      </FooterLink>
    )) ?? []),
    <LinksSectionRelatedLinksCopyright key={"footer-copyright"}>
      {copyright}
    </LinksSectionRelatedLinksCopyright>,
  ];

  const linksSectionContent = [
    <LinksSectionSocialLinks key={"footer-social-links"} linksSectionSocialAriaLabel={t("social")}>
      {linksSectionSocialContent}
    </LinksSectionSocialLinks>,
    <LinksSectionRelatedLinks
      key={"footer-related-links"}
      linksSectionRelatedAriaLabel={t("external")}
    >
      {linksSectionRelatedContent}
    </LinksSectionRelatedLinks>,
  ];

  return (
    <FooterADS variant="primary-900">
      <LogoSectionContainer>{logoSectionContent}</LogoSectionContainer>
      <FinancingSectionContainer financingSectionAriaLabel={t("partners")}>
        {financingSectionContent}
      </FinancingSectionContainer>
      <LinksSectionContainer>{linksSectionContent}</LinksSectionContainer>
    </FooterADS>
  );
};

export default function Footer({ data }: FooterI) {
  const { t } = useTranslation("footer");

  return (
    <footer className="bg-primary-900 text-white" aria-label={t("footer")}>
      <FooterNavigation title={data.title} groups={data.groups} />
      <FooterBottom
        description={data.description}
        logos={data.logos}
        social={data.social}
        related={data.related}
        copyright={data.copyright}
      />
    </footer>
  );
}
