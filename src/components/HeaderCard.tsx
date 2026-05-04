"use client";

import React from "react";
import { CardGeneral } from "@ama-pt/agora-design-system";

interface HeaderCardProps {
  iconDefault: string;
  iconHover?: string;
  title: string;
  description: string;
  href: string;
  onLinkClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
}

export const HeaderCard = ({
  iconDefault,
  iconHover,
  title,
  description,
  href,
  onLinkClick,
}: HeaderCardProps) => {
  const hasNavigation = href !== "#";

  const wrapperCallback = React.useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    // Make internal anchors non-focusable
    node.querySelectorAll("a").forEach((link) => link.setAttribute("tabindex", "-1"));
  }, []);

  return (
    <div
      ref={wrapperCallback}
      className="header-card-wrapper cursor-pointer"
      onClickCapture={(e) => {
        if (hasNavigation) {
          e.preventDefault();
          e.stopPropagation();
          onLinkClick(e as unknown as React.MouseEvent<HTMLAnchorElement>, href);
        }
      }}
    >
      <CardGeneral
        isCardHorizontal={true}
        isBlockedLink={true}
        variant="neutral-100"
        iconDefault={iconDefault}
        iconHover={iconHover}
        titleText={title}
        descriptionText={description}
        anchor={{
          href,
          children: "",
          hasIcon: true,
          trailingIcon: "agora-line-arrow-right-circle",
          trailingIconHover: "agora-solid-arrow-right-circle",
          onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault();
            e.stopPropagation();
            if (hasNavigation) {
              onLinkClick(e, href);
            }
          },
        }}
      />
    </div>
  );
};
