import React from "react";
import { twMerge } from "tailwind-merge";

export interface IHeroRootProps {
  children?: React.ReactNode;
  className?: string;
  variant?: "dark" | "light";
  /**
   * Background image for the band. Pass `null` for a flat `bg-primary-900` band
   * with no image and no gradient overlay.
   */
  backgroundImageUrl?: string | null;
  hasMinHeight?: boolean;
}

export default function HeroRoot({
  children,
  className,
  variant = "dark",
  backgroundImageUrl = "/Banner/hero-bg.jpg",
  hasMinHeight = true,
}: IHeroRootProps) {
  const isLight = variant === "light";
  const hasBackground = !isLight && !!backgroundImageUrl;

  return (
    <div
      className={twMerge(
        "w-full",
        isLight ? "bg-primary-100" : "bg-primary-900 xl:min-h-[396px]",
        hasBackground && [
          "bg-(image:--hero-bg) bg-no-repeat",
          // mobile/tablet: fill the band, centered
          "bg-cover bg-center",
          // desktop: designed framing (fills width, reveals lower part of the image)
          "xl:bg-size-[100%] xl:bg-position-[center_70%]",
          hasMinHeight && "min-h-[396px]",
        ],
        className
      )}
      style={
        hasBackground
          ? ({ "--hero-bg": `url("${backgroundImageUrl}")` } as React.CSSProperties)
          : undefined
      }
      data-testid="hero-root"
    >
      <div
        className={twMerge(
          "flex w-full flex-col items-center justify-center",
          !isLight && "xl:min-h-[396px]",
          hasBackground &&
            "bg-linear-to-r from-secondary-900 via-secondary-900/64 to-secondary-900/24",
          hasMinHeight && "min-h-[396px]"
        )}
      >
        <div className="container flex flex-col gap-32 py-64">{children}</div>
      </div>
    </div>
  );
}
