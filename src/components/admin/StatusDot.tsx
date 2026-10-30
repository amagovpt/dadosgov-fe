"use client";

import React from "react";
import { twMerge } from "tailwind-merge";

type StatusDotVariant =
  | "success"
  | "warning"
  | "danger"
  | "informative"
  | "neutral"
  | "primary"
  | "secondary";

const VARIANT_COLORS: Record<StatusDotVariant, string> = {
  success: "var(--color-success-600, #16a34a)",
  warning: "var(--color-warning-600, #ca8a04)",
  danger: "var(--color-danger-600, #dc2626)",
  informative: "var(--color-informative-600, #2563eb)",
  neutral: "var(--color-neutral-500, #737373)",
  primary: "var(--color-primary-600, #1d4ed8)",
  secondary: "var(--color-secondary-600, #7c3aed)",
};

interface StatusDotProps {
  variant?: StatusDotVariant;
  children: React.ReactNode;
  dotClassName?: string;
}

export default function StatusDot({ variant = "neutral", children, dotClassName }: StatusDotProps) {
  return (
    <span className="text-sm flex items-center gap-8 text-neutral-900">
      <span
        className={twMerge("inline-block size-[10px] shrink-0 rounded-full", dotClassName)}
        style={{ backgroundColor: VARIANT_COLORS[variant] }}
      />
      {children}
    </span>
  );
}
