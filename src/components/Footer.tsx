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
} from "@ama-pt/agora-design-system";
import Image from "next/image";
import { LocalizedLink } from "@/components/Shared/LocalizedLink";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";

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

const FooterNavigation = ({ title, groups }: FooterNavigationI) => {
  return (
    <div className="container mx-auto flex flex-col gap-32 py-32 lg:py-64">
      <h3 className="text-l-bold text-white">{title}</h3>
      <div className="grid grid-cols-1 gap-32 md:grid-cols-2 lg:grid-cols-3">
        {groups
          ?.filter((g) => g.enabled === true)
          ?.map((group, idx) => (
            <div key={idx} className="flex flex-col gap-16">
              <h4 className="text-m-semibold text-white">{group.label}</h4>
              <ul className="flex flex-col gap-16">
                {group.cards
                  ?.filter((l) => l.enabled === true)
                  ?.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <LocalizedLink
                        href={link.href}
                        className="text-sm text-white transition-colors hover:underline"
                        {...(link.href.startsWith("http")
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                      >
                        {link.title}
                      </LocalizedLink>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
      </div>
    </div>
  );
};

// -------------------------------------------------------------------------------------------------------------------

const FooterBrands = () => {
  return (
    <div className="container mx-auto flex flex-wrap items-center gap-48 py-64">
      <Image
        src={"/Logos/pt-republic-color.svg"}
        alt="Agora"
        height={48}
        width={160}
        style={{ height: 48, width: "auto" }}
        className="object-contain"
      />
      <Image
        src={"/Logos/Logotipo_ARTE__Horizontal_branco_pt.svg"}
        alt="Agora"
        height={48}
        width={160}
        style={{ height: 48, width: "auto" }}
        className="object-contain"
      />
    </div>
  );
};

const FooterBottom = ({ description, logos, social, related, copyright }: FooterBottomI) => {
  const { t } = useTranslation("footer");

  const financingSectionContent = [
    <FooterDisclaimer key="footer-description">{description}</FooterDisclaimer>,
    ...(logos?.map((logo, index) => (
      <FooterGenericLogo key={`footer-logo-${index}`}>
        <Image
          src={`/Logos/${logo.icon}.svg`}
          alt={logo.alt}
          height={26}
          width={100}
          style={{ opacity: 0.5, height: 26, width: "auto" }}
          className="object-fill"
        />
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
    <LinksSectionSocialLinks
      key={"footer-social-links"}
      linksSectionSocialAriaLabel={t("social")}
      className="flex flex-col w-full items-start border-t-2 border-t-[#ffffff0d] py-32 lg:w-1/3 lg:border-t-0 [&_ul]:flex [&_ul]:flex-row [&_ul]:flex-wrap [&_ul]:gap-8"
    >
      {linksSectionSocialContent}
    </LinksSectionSocialLinks>,
    <LinksSectionRelatedLinks
      key={"footer-related-links"}
      linksSectionRelatedAriaLabel={t("external")}
      className="flex flex-1 flex-col items-start gap-32 border-t-2 border-t-[#ffffff0d] border-l-2 border-l-[#ffffff0d] px-32 py-32 pl-32 lg:px-0 lg:py-0 lg:items-end lg:border-t-0 lg:py-32 pb-64 lg:pl-[100px] lg:my-32 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-4 [&_ul]:lg:flex-row [&_ul]:lg:flex-wrap [&_ul]:lg:justify-end [&_ul]:lg:gap-32 [&_ul]:lg:gap-y-0"
    >
      {linksSectionRelatedContent}
    </LinksSectionRelatedLinks>,
  ];

  return (
    <div>
      <FooterADS variant="primary-900">
        <FinancingSectionContainer
          aria-label={t("partners")}
          className="relative mx-auto flex justify-between gap-32 py-32 before:absolute before:left-1/2 before:top-0 before:w-screen before:-translate-x-1/2 before:border-t-2 before:border-[#ffffff0d] before:content-[''] after:absolute after:bottom-0 after:left-1/2 after:w-screen after:-translate-x-1/2 after:border-b-2 after:border-[#ffffff0d] after:content-[''] lg:container [&_ul]:flex [&_ul]:flex-1 [&_ul]:gap-32"
        >
          {financingSectionContent}
        </FinancingSectionContainer>
        <LinksSectionContainer aria-label={t("related")} className="mx-auto lg:container flex">
          {linksSectionContent}
        </LinksSectionContainer>
      </FooterADS>
    </div>
  );
};


export default function Footer({ data }: FooterI) {
  const { t } = useTranslation("footer");

  return (
    <footer className="overflow-x-hidden bg-primary-900 text-white" aria-label={t("footer")}>
      <FooterNavigation title={data.title} groups={data.groups} />
      <FooterBrands />
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
