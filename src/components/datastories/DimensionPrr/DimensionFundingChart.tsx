"use client";
import { useTranslation } from "react-i18next";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  ChartOptions,
  LinearScale,
  ScriptableContext,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Bar } from "react-chartjs-2";
import { Typograph } from "@/components/Shared/Generics/Typograph";
import { formatCurrency } from "@/utils/formatCurrency";
import { readCssVar } from "@/utils/cssVar";
import type { DimensionFunding } from "@/lib/prr/dimensions";

ChartJS.register(CategoryScale, LinearScale, BarElement);

function makeDiagonalPattern(ctx: CanvasRenderingContext2D, line: string, background: string) {
  const size = 8;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const c = canvas.getContext("2d")!;
  c.fillStyle = background;
  c.fillRect(0, 0, size, size);
  c.strokeStyle = line;
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(0, size);
  c.lineTo(size, 0);
  c.stroke();
  return ctx.createPattern(canvas, "repeat")!;
}

export default function DimensionFundingChart({
  totalValue,
  spentValue,
  supportValue,
  loanValue,
}: DimensionFunding) {
  const { t } = useTranslation("common");

  const barColor = readCssVar("--color-primary-400");
  const stripeColor = readCssVar("--color-primary-400");
  const stripeBackground = readCssVar("--color-primary-900");
  const textColor = readCssVar("--color-white");
  const axisColor = readCssVar("--color-neutral-500");

  const ariaLabel = t("prr.dimensions.fundingChartAria", {
    totalValue: formatCurrency(totalValue, t),
    spentValue: formatCurrency(spentValue, t),
  });

  const data = {
    labels: [t("prr.dimensions.totalValue"), t("prr.dimensions.spentValue")],
    datasets: [
      {
        data: [totalValue, spentValue],
        backgroundColor: (ctx: ScriptableContext<"bar">) =>
          ctx.dataIndex === 0
            ? makeDiagonalPattern(ctx.chart.ctx, stripeColor, stripeBackground)
            : barColor,
        barThickness: 85,
        borderRadius: 0,
        borderSkipped: false,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 50, bottom: 5 } },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
      datalabels: {
        display: true,
        anchor: "end",
        align: "top",
        color: textColor,
        font: { size: 16, weight: "bold" },
        formatter: (value: number) => formatCurrency(value, t),
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: true, color: axisColor },
        ticks: { color: textColor, font: { size: 14 } },
      },
      y: {
        display: false,
        beginAtZero: true,
        max: Math.max(totalValue, spentValue) * 1.02,
      },
    },
  };

  const financingTypes = [
    { label: t("prr.dimensions.supportValues"), value: supportValue },
    { label: t("prr.dimensions.loanValues"), value: loanValue },
  ];

  return (
    <div className="flex w-full max-w-[600px] flex-col gap-24">
      <div className="h-[460px]">
        <Bar
          data={data}
          options={options}
          plugins={[ChartDataLabels]}
          role="img"
          aria-label={ariaLabel}
        />
      </div>
      <div className="flex flex-col gap-8">
        <Typograph tag="p" className="text-m-bold text-white">
          {t("prr.dimensions.financingTypes")}
        </Typograph>
        <div className="flex flex-col border-t border-neutral-700">
          {financingTypes.map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between border-b border-neutral-700 py-8"
            >
              <Typograph tag="span" className="text-m-regular text-neutral-500">
                {label}
              </Typograph>
              <Typograph tag="span" className="text-m-regular text-neutral-500">
                {formatCurrency(value, t)}
              </Typograph>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
