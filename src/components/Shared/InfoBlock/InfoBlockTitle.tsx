"use client";
import { twJoin } from "tailwind-merge";
import { Typograph } from "../Generics/Typograph";

export interface InfoBlockTitleProps {
  title?: string;
  highlight?: string | string[];
  titleLevel?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  className?: string;
}

export default function InfoBlockTitle({
  title = "",
  highlight,
  titleLevel = "h2",
  className = "",
}: InfoBlockTitleProps) {

  function highlightText(text: string, toHighlight?: string | string[]) {
    if (!text || !toHighlight)
      return (
        <Typograph
          tag={titleLevel}
          className={twJoin("text-2xl-light text-primary-900 max-w-[596px]", className)}
        >
          {text}
        </Typograph>
      );

    if (!Array.isArray(toHighlight)) toHighlight = [toHighlight];

    const highlights = text.split(
      new RegExp(`\\b(${toHighlight.join("|")})\\b`, "gi")
    );

    return (
      <Typograph
        tag={titleLevel}
        className={twJoin("", className)}
      >
        {highlights.map((highlight, i) =>
          toHighlight.some(
            (p) => p.toLowerCase() === highlight.toLowerCase()
          ) ? (
            <strong key={i} className="text-2xl-bold text-primary-900">{highlight}</strong>
          ) : (
            <span key={i} className="text-2xl-light text-primary-900">{highlight}</span>
          )
        )}
      </Typograph>
    );
  }

  return highlightText(title, highlight);
}
