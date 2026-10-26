"use client";

import { Icon, LinkWrapper, AnchorVariant } from "@ama-pt/agora-design-system";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import IconComponent from "./IconComponent";
import { useRouter } from "next/navigation";

interface LinkIconProps {
  href?: string;
  onClick?: () => void;
  title: string;
  className?: string;
  target?: "_blank" | "_self" | "_parent" | "_top";
  variant?: AnchorVariant;
  darkMode?: boolean;
  style?: "link" | "button";
  hasRightIcon?: boolean;
  backgroundColor?: string;
  icon?: {
    name: string;
    hoverName?: string;
  };
  leftIcon?: {
    name: string;
    hoverName?: string;
  };
}

export function LinkIcon({
  href,
  onClick,
  title,
  className,
  target = "_self",
  variant = "neutral",
  darkMode = false,
  style = "link",
  icon,
  hasRightIcon = true,
  leftIcon,
  backgroundColor = "primary-600",
}: LinkIconProps) {
  const routerNav = useRouter();

  const { name = "agora-line-arrow-right-circle", hoverName = "agora-solid-arrow-right-circle" } =
    icon || {};

  const handleClick = () => {
    if (onClick) onClick();
    routerNav.push(href ?? "");
  };

  return (
    <LinkWrapper
      appearance="link"
      variant={variant}
      darkMode={darkMode}
      className={style === "button" ? `bg-${backgroundColor} h-64` : ""}
    >
      <Link
        href={href ?? ""}
        target={target}
        onClick={() => handleClick}
        className={twMerge(
          "group flex items-center gap-8 text-m-regular",
          style === "button"
            ? `px-16 text-white transition-colors bg-${backgroundColor} h-full`
            : "",
          className
        )}
      >
        {leftIcon && (
          <>
            <IconComponent
              aria-hidden
              name={leftIcon.name}
              className={twMerge("group-hover:hidden", style === "button" ? "text-white" : "")}
            />
            <IconComponent
              aria-hidden
              name={leftIcon.hoverName || leftIcon.name}
              className={twMerge(
                "hidden group-hover:block",
                style === "button" ? "text-white" : ""
              )}
            />
          </>
        )}
        {title}
        {hasRightIcon && (
          <>
            <Icon
              aria-hidden
              name={name}
              className={twMerge("group-hover:hidden", style === "button" ? "text-white" : "")}
            />
            <Icon
              aria-hidden
              name={hoverName}
              className={twMerge(
                "hidden group-hover:block",
                style === "button" ? "text-white" : ""
              )}
            />
          </>
        )}
      </Link>
    </LinkWrapper>
  );
}
