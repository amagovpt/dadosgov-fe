import React from "react";
import { twMerge } from "tailwind-merge";
import { Typograph } from "@/components/Shared/Generics/Typograph";

export interface IHeroDescriptionProps {
  /**
   * One `<p>` per paragraph.
   *
   * Plain strings — a `parseHtmlToParagraphs()` result — are each wrapped in a
   * `<p>`. Already-rendered nodes — a `formatHtmlParagraphs()` result, which
   * hands back `<p>`/`<ol>`/`<ul>` elements — pass straight through, so they are
   * never nested inside another `<p>`.
   */
  description?: string | string[] | React.ReactNode;
  /** Applied to the wrapper that spaces the paragraphs. */
  className?: string;
  /** Applied to each paragraph this component renders itself. */
  classNameParagraph?: string;
}

const PARAGRAPH = "!text-white text-m-regular";

// `text-m-regular` sits on the wrapper as well as on the paragraphs so that
// passed-through nodes — a `formatHtmlParagraphs()` result, a call site's own
// `<p className="text-primary-100">` — inherit the type scale instead of
// falling back to the browser default. The `[&_a]` selectors stop inline links
// from re-sizing themselves inside it.
const WRAPPER =
  "flex flex-col gap-16 !text-white text-m-regular [&_a]:text-[length:inherit] [&_a]:font-[inherit]";

export default function HeroDescription({
  description,
  className,
  classNameParagraph,
}: IHeroDescriptionProps) {
  // `Children.toArray` flattens, drops null/undefined/booleans and keys the
  // elements, so a single string and a list of paragraphs share one code path.
  const paragraphs = React.Children.toArray(description).filter(
    (paragraph) => typeof paragraph !== "string" || paragraph.trim() !== ""
  );

  if (paragraphs.length === 0) return null;

  return (
    <div
      className={twMerge(WRAPPER, className)}
      data-testid="hero-description"
    >
      {paragraphs.map((paragraph, index) =>
        typeof paragraph === "string" ? (
          <Typograph key={index} tag="p" className={twMerge(PARAGRAPH, classNameParagraph)}>
            {paragraph}
          </Typograph>
        ) : (
          paragraph
        )
      )}
    </div>
  );
}
