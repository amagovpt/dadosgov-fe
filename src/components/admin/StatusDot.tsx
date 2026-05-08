"use client";

import React from "react";

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
}

export default function StatusDot({
  variant = "neutral",
  children,
}: StatusDotProps) {
  return (
    <span className="flex items-center gap-8 text-sm text-neutral-900">
      <span
        className="inline-block w-[10px] h-[10px] rounded-full flex-shrink-0"
        style={{ backgroundColor: VARIANT_COLORS[variant] }}
      />
      {children}
    </span>
  );
}
