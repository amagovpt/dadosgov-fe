import React from "react";
import { twMerge } from "tailwind-merge";
import { Typograph } from "@/components/Shared/Generics/Typograph";

export interface IHeroTitleProps {
  children?: React.ReactNode;
  className?: string;
}


export default function HeroTitle({ children, className }: IHeroTitleProps) {
  if (!children) return null;

  return (
    <Typograph
      tag="h1"
      className={twMerge("flex flex-col items-start leading-tight !text-2xl-bold text-white", className)}
      data-testid="hero-title"
    >
      {children}
    </Typograph>
  );
}
