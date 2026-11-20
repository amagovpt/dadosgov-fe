"use client";

import { Icon } from "@ama-pt/agora-design-system";
import Link from "next/link";
import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export interface ILinkCard {
  href: string;
  className?: string;
  /** colour of the arrow at rest; it always turns primary on hover */
  variant?: "primary" | "neutral";
  target?: "_blank" | "_self";
  children: ReactNode;
}

/**
 * Card that links as a whole, with the arrow icon at the right edge. The arrow is decoration
 * only, so the card renders a single anchor instead of nesting a LinkIcon inside a link.
 */
export default function LinkCard({
  href,
  className,
  variant = "neutral",
  target,
  children,
}: ILinkCard) {
  const restFill = variant === "primary" ? "fill-primary-600" : "fill-neutral-900";

  return (
    <Link
      href={href}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      className={twMerge("group relative flex flex-col rounded-4 bg-white", className)}
    >
      {children}
      <span className="absolute top-1/2 right-24 -translate-y-1/2" aria-hidden>
        <Icon
          name="agora-line-arrow-right-circle"
          className={twMerge("block group-hover:hidden", restFill)}
        />
        <Icon
          name="agora-solid-arrow-right-circle"
          className="hidden fill-primary-600 group-hover:block"
        />
      </span>
    </Link>
  );
}
