"use client";

import HeroGeneral from "@/components/HeroGeneral";
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
    <HeroGeneral
      title={
        <>
          <span className="mb-[10px] text-32 font-[500] text-white">
            {content.title}{" "}
          </span>
          {content.highlight ? (
            <span className="text-32 font-[500] text-white">{content.highlight}</span>
          ) : null}
        </>
      }
      backgroundImageUrl="/Banner/hero-bg.png"
      subtitle={
        <>
          <div className="mt-48 block text-[20px] font-bold text-white">
            {formatHtmlParagraphs(content.description ?? "", "text-[20px] font-bold text-white")}
          </div>

          <div className="shadow-lg dropdown absolute mb-64 w-full bg-white text-neutral-900"></div>

          {links.length > 0 ? (
            <div className="mt-16 flex flex-col gap-16">
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
          ) : null}
        </>
      }
    />
  );
}
