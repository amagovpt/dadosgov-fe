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
} from "@ama-pt/agora-design-system";
import Image from "next/image";
import Link from "next/link";
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
                      <Link
                        href={link.href}
                        className="text-sm text-white transition-colors hover:underline"
                        {...(link.href.startsWith("http")
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                      >
                        {link.title}
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

// -------------------------------------------------------------------------------------------------------------------

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
  ];

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
      aria-label={t("social")}
      className="flex w-full items-center border-t-2 border-t-[#ffffff0d] px-32 py-32 md:px-64 lg:w-1/3 lg:border-t-0 lg:py-initial lg:pl-64 lg:pr-32 xl:pl-112 [&_ul]:flex [&_ul]:flex-row [&_ul]:flex-wrap [&_ul]:gap-8"
    >
      {linksSectionSocialContent}
    </LinksSectionSocialLinks>,
    <LinksSectionRelatedLinks
      key={"footer-related-links"}
      aria-label={t("external")}
      className="flex flex-1 flex-col items-start gap-32 border-t-2 border-t-[#ffffff0d] px-32 py-32 pl-32 md:px-64 lg:items-end lg:border-t-0 lg:py-64 lg:pl-32 lg:pr-64 xl:pr-112 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-16 [&_ul]:lg:flex-row [&_ul]:lg:flex-wrap [&_ul]:lg:gap-32"
    >
      {linksSectionRelatedContent}
    </LinksSectionRelatedLinks>,
  ];

  return (
    <div className="mx-auto lg:container">
      <FooterADS variant="primary-900">
        <FinancingSectionContainer aria-label={t("partners")}>
          {financingSectionContent}
        </FinancingSectionContainer>

        <LinksSectionContainer aria-label={t("related")}>
          {linksSectionContent}
        </LinksSectionContainer>
      </FooterADS>
    </div>
  );
};

// -------------------------------------------------------------------------------------------------------------------

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
