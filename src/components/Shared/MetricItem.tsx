"use client";

import { Icon } from "@ama-pt/agora-design-system";
import { formatMetricValue } from "@/utils/formatNumber";

export type MetricItemProps = {
  /** Agora icon name, e.g. `agora-line-eye`. */
  icon: string;
  value?: number;
  /** What the number counts; shown on hover and read by screen readers. */
  label: string;
  /** `light` for dark backgrounds (white icon and text). */
  tone?: "dark" | "light";
};

/**
 * One metric as an icon followed by its number, the row the reuse detail page shows.
 *
 * Spans only, so it can sit inside `CardDescription` and other components that render a `<p>`.
 */
export function MetricItem({ icon, value, label, tone = "dark" }: MetricItemProps) {
  const light = tone === "light";
  return (
    <span className="flex items-center gap-8" title={label}>
      <Icon
        name={icon}
        className={light ? "h-20 w-20 fill-white" : "h-20 w-20 fill-[var(--color-neutral-900)]"}
        aria-hidden="true"
      />
      <span className={light ? "text-white" : "text-neutral-900"}>
        {formatMetricValue(value, 0)}
        <span className="sr-only"> {label}</span>
      </span>
    </span>
  );
}
