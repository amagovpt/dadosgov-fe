"use client";

import { Hero } from "@/components/Shared/Hero";
import AppIcon from "@/components/Primitives/AppIcon";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import { useTranslation } from "react-i18next";
import type { SupportAnchor, SupportHeroContent } from "@/service/types/support";

interface SupportHeroProps {
  content: SupportHeroContent;
}

export function SupportHero({ content }: SupportHeroProps) {
  const { t } = useTranslation("support");
  const links = t("hero.links", { returnObjects: true }) as SupportAnchor[];

  return (
    <Hero.Root backgroundImageUrl="/Banner/hero-bg.png">
      <Hero.Breadcrumb />
      <Hero.Content>
        <Hero.Title>
          <span className="mb-[10px] text-32 font-[500] text-white">{content.title} </span>
          {content.highlight ? (
            <span className="text-32 font-[500] text-white">{content.highlight}</span>
          ) : null}
        </Hero.Title>
        <Hero.Description
          description={
            <div className="mt-48 block text-[20px] font-bold text-white">
              {formatHtmlParagraphs(content.description ?? "", "text-[20px] font-bold text-white")}
            </div>
          }
        />
      </Hero.Content>
      {links.length > 0 ? (
        <Hero.Actions>
          <div className="flex flex-col gap-16">
            {links.map((link) => (
              <a
                key={`${link.href}-${link.children}`}
                href={link.href}
                className="flex cursor-pointer items-center gap-8 text-white hover:underline"
              >
                {link.children}
                <AppIcon
                  name={link.icon ?? "agora-line-arrow-right-circle"}
                  className="fill-white"
                />
              </a>
            ))}
          </div>
        </Hero.Actions>
      ) : null}
    </Hero.Root>
  );
}
