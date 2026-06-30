import React from "react";

interface HighlightTextOptions {
  /** Classe aplicada ao(s) segmento(s) destacado(s). */
  highlightClassName?: string;
  /** Classe aplicada ao restante texto. */
  textClassName?: string;
}

/**
 * Divide `text` pelo(s) termo(s) `highlight` (case-insensitive) e envolve cada
 * segmento correspondido num <span> com `highlightClassName`; o restante usa
 * `textClassName`. Devolve null para texto vazio; sem termo de highlight devolve
 * todo o texto num único <span> com `textClassName`.
 */
export function highlightText(
  text?: string,
  highlight?: string | string[],
  { highlightClassName = "", textClassName = "" }: HighlightTextOptions = {}
): React.ReactNode {
  if (!text) return null;

  const terms = (Array.isArray(highlight) ? highlight : [highlight]).filter(
    (term): term is string => Boolean(term && term.trim())
  );

  if (terms.length === 0) {
    return <span className={textClassName}>{text}</span>;
  }

  const pattern = terms
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const lowered = terms.map((term) => term.toLowerCase());
  const parts = text.split(new RegExp(`(${pattern})`, "gi")).filter(Boolean);

  return parts.map((part, i) =>
    lowered.includes(part.toLowerCase()) ? (
      <span key={i} className={highlightClassName}>
        {part}
      </span>
    ) : (
      <span key={i} className={textClassName}>
        {part}
      </span>
    )
  );
}
