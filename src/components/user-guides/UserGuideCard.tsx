"use client";

import { useTranslation } from "react-i18next";
import AppIcon from "@/components/Primitives/AppIcon";
import CardIllustrative from "@/components/Primitives/Cards/CardIllustrative";
import { LocalizedLink } from "@/components/Shared/LocalizedLink";
import type { UserGuideSummary } from "@/service/types/user-guides";

export const USER_GUIDES_PATH = "/recursos/como-usar-o-portal/guias-do-utilizador";

interface UserGuideCardProps {
  guide: UserGuideSummary;
  className?: string;
}

/** Outlined card with title, description and an arrow link to the guide. */
export function UserGuideCard({ guide, className }: UserGuideCardProps) {
  const { t } = useTranslation("user-guides");

  return (
    <CardIllustrative
      variant="white"
      isCardHorizontal
      // The DS card is sized for illustrations (96px top padding, 24px title); the guide
      // cards are compact text cards.
      className={`border! border-primary-600! h-full p-32! [&_.card-inner-container]:pt-0! [&_.title]:text-l-bold! [&_.title]:text-primary-900! [&_.description]:text-s-regular! [&_.description]:text-neutral-900! ${className ?? ""}`}
      title={guide.title}
      description={guide.cardDescription || undefined}
      mainLink={
        <LocalizedLink
          href={`${USER_GUIDES_PATH}/${guide.id}`}
          aria-label={t("openGuide", { title: guide.title })}
          className="flex items-center h-full text-primary-600"
        >
          <AppIcon name="agora-line-arrow-right-circle" className="w-24 h-24" />
        </LocalizedLink>
      }
    />
  );
}
