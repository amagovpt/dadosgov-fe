"use client";

import React from "react";

interface SeeMoreToggleProps {
  isExpanded: boolean;
  onToggle: () => void;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  moreLabel?: string;
  lessLabel?: string;
}

export const SeeMoreToggle: React.FC<SeeMoreToggleProps> = ({
  isExpanded,
  onToggle,
  className = "",
  iconClassName = "",
  textClassName = "",
  moreLabel = "Ver mais",
  lessLabel = "Ver menos",
}) => {
  const iconBaseClass = `block [transform-style:preserve-3d] transition-transform duration-[250ms] ease-linear ${
    isExpanded ? "[transform:rotateX(180deg)]" : "[transform:rotateX(0deg)]"
  }`;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isExpanded}
      className={className}
    >
      <svg
        className={`${iconBaseClass} ${iconClassName}`.trim()}
        style={{ transformOrigin: "center" }}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
      <span className={textClassName}>{isExpanded ? lessLabel : moreLabel}</span>
    </button>
  );
};
