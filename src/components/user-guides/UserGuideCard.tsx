"use client";

import type { MouseEvent as ReactMouseEvent } from "react";
import { useRouter } from "next/navigation";
import {
  BodySectionContainer,
  CardDescription,
  CardGeneralV2,
  CardTitle,
  HeaderSectionContainer,
} from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";
import { useLocalizedHref } from "@/hooks/useLocalizedHref";
import type { UserGuideSummary } from "@/service/types/user-guides";

export const USER_GUIDES_PATH = "/recursos/como-usar-o-portal/guias-do-utilizador";

interface UserGuideCardProps {
  guide: UserGuideSummary;
  className?: string;
}

export function UserGuideCard({ guide, className }: UserGuideCardProps) {
  const { t } = useTranslation("user-guides");
  const router = useRouter();
  const href = useLocalizedHref()(`${USER_GUIDES_PATH}/${guide.id}`);

  const onClickCapture = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    router.push(href);
  };

  return (
    <CardGeneralV2
      variant="primary-500-outline"
      isBlockedLink
      className={`h-full ${className ?? ""}`}
      onClickCapture={onClickCapture}
      sideAnchor={{ href, "aria-label": t("openGuide", { title: guide.title }) }}
    >
      {[
        <HeaderSectionContainer key="header">
          <CardTitle as="h3">{guide.title}</CardTitle>
        </HeaderSectionContainer>,
        ...(guide.cardDescription
          ? [
              <BodySectionContainer key="body">
                <CardDescription>{guide.cardDescription}</CardDescription>
              </BodySectionContainer>,
            ]
          : []),
      ]}
    </CardGeneralV2>
  );
}
