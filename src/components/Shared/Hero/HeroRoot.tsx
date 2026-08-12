import React from "react";
import { twMerge } from "tailwind-merge";

export interface IHeroRootProps {
  children?: React.ReactNode;
  className?: string;
  /**
   * Background image for the band. Pass `null` for a flat `bg-primary-900` band
   * with no image and no gradient overlay.
   */
  backgroundImageUrl?: string | null;
}


export default function HeroRoot({
  children,
  className,
  backgroundImageUrl = "/Banner/hero-bg.jpg",
}: IHeroRootProps) {
  const hasBackground = !!backgroundImageUrl;

  return (
    <div
      className={twMerge(
        "w-full bg-primary-900 xl:min-h-[396px]",
        hasBackground && [
          "bg-[image:var(--hero-bg)] bg-no-repeat",
          // mobile/tablet: fill the band, centered
          "bg-cover bg-center",
          // desktop: designed framing (fills width, reveals lower part of the image)
          "xl:bg-[length:100%] xl:bg-[position:center_70%]",
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
          "flex w-full flex-col items-center justify-center xl:min-h-[396px]",
          hasBackground &&
            "bg-gradient-to-r from-secondary-900 via-secondary-900/[64%] to-secondary-900/[24%]"
        )}
      >
        <div className="container flex flex-col gap-32 py-64">{children}</div>
      </div>
    </div>
  );
}
