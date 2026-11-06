"use client";
import React, { useEffect, useRef } from "react";
import { AgCharts } from "ag-charts-react";
import {
  AgChartOptions,
  AgDonutSeriesOptions,
  DonutSeriesModule,
  LegendModule,
  ModuleRegistry,
} from "ag-charts-community";

// AG Charts 13+ ships no chart types by default; only what is registered is bundled.
// DonutSeriesModule pulls in PolarChartModule; LegendModule backs the `legend` option.
ModuleRegistry.registerModules([DonutSeriesModule, LegendModule]);

interface DonutProps {
  percentual: number | undefined;
  color?: string;
  secondaryColor?: string;
  variant?: "solid" | "hatched";
}

export default function Donut({
  percentual,
  color,
  secondaryColor,
  variant = "solid",
}: DonutProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current?.querySelector('.ag-charts-swapchain, [role="img"]');
    if (element) {
      element.setAttribute("aria-hidden", "true");
      element.removeAttribute("role");
      element.setAttribute("tabIndex", "-1");
    }
  });
  const defaultColor = "#FFC200";
  const donutColor = color ?? defaultColor;

  const defaultSecondaryColor = "#fff";
  const donutSecondaryColor = secondaryColor ?? defaultSecondaryColor;

  const percent = clamp(percentual ?? 0, 0, 100);

  const data = getData(percent);
  const fills = [donutColor, donutSecondaryColor];
  const sectorSpacing = 5;
  const extraSeriesProps: Partial<AgDonutSeriesOptions> = {};

  if (variant === "hatched") {
    extraSeriesProps.itemStyler = ({
      datum
    }: {
      datum: { asset: "Full" | "Rest"; percent: number };
    }) => {
      if (datum.asset === "Full") {
        return {
          fill: {
            type: "pattern",
            pattern: "forward-slanted-lines",
            stroke: donutColor,
            strokeWidth: 1,
            backgroundFill: "transparent",
            opacity: 1,
          },
        };
      }
      return { fill: donutSecondaryColor };
    };

    extraSeriesProps.cornerRadius = 0;
  }

  const options: AgChartOptions = {
    data,
    background: { fill: "transparent" },
    padding: {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    },
    series: [
      {
        type: "donut",
        angleKey: "percent",
        outerRadiusRatio: 1,
        innerRadiusRatio: 0.5,
        sectorSpacing,
        // Decorative chart (aria-hidden, no tooltip): hovering must not restyle sectors.
        highlight: {
          enabled: false,
        },
        fills,
        ...extraSeriesProps,
      },
    ],
    keyboard: {
      enabled: false,
      tabIndex: -1,
    },
    legend: {
      enabled: false,
    },
    tooltip: {
      enabled: false,
    },
  };

  return (
    <div ref={ref} aria-hidden="true" className="w-128 h-120 shrink-0">
      <AgCharts options={options} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

function getData(percentual: number | undefined) {
  const percentage = percentual ?? 0;
  return [
    { asset: "Full", percent: percentage },
    { asset: "Rest", percent: 100 - percentage },
  ];
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
