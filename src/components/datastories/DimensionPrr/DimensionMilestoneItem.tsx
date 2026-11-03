"use client";
import { Icon } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";
import { BarElement, CategoryScale, Chart as ChartJS, LinearScale } from "chart.js";
import { Bar } from "react-chartjs-2";
import { Typograph } from "@/components/Shared/Generics/Typograph";
import { readCssVar } from "@/utils/cssVar";
import { formatNumber } from "@/utils/formatNumber";
import type { DimensionMilestone } from "@/lib/prr/dimensions";

ChartJS.register(CategoryScale, LinearScale, BarElement);

type DimensionMilestoneItemProps = DimensionMilestone & {
  isLast?: boolean;
};

const formatValue = (value: number) => value.toLocaleString("pt-PT");

export default function DimensionMilestoneItem({
  title,
  date,
  description,
  steps,
  progressPercentage,
  isComplete = false,
  interventions,
  isLast = false,
}: DimensionMilestoneItemProps) {
  const { t, i18n } = useTranslation("common");
  const clampedPercentage = Math.max(0, Math.min(progressPercentage, 100));
  const isNearStart = clampedPercentage < 5;
  const dateLabel = date || steps[steps.length - 1]?.year || "";
  const displayedPercentage = Number(progressPercentage.toFixed(2));
  const isObjectiveExceeded = displayedPercentage >= 100;
  // A single step sits at the start of the timeline instead of dividing by zero
  const stepPosition = (index: number) =>
    steps.length > 1 ? (index / (steps.length - 1)) * 100 : 0;

  const timelineAriaLabel = steps
    .map((step, index) => {
      const values = { year: step.year, value: formatValue(step.value) };
      if (index === 0) return t("prr.dimensions.milestoneYearStart", values);
      if (index === steps.length - 1) {
        return t(
          isComplete
            ? "prr.dimensions.milestoneYearEndComplete"
            : "prr.dimensions.milestoneYearEnd",
          { ...values, percentage: displayedPercentage }
        );
      }
      return t("prr.dimensions.milestoneYearMiddle", values);
    })
    .join(" ");

  return (
    <div className="flex w-full flex-col gap-32 sm:gap-24 md:flex-row">
      {/* Status icon with the dotted line to the next milestone */}
      <div className="flex shrink-0 flex-col items-start md:items-center">
        <div className="flex h-56 w-56 shrink-0 items-center justify-center rounded-full bg-primary-100">
          <Icon
            name={isComplete ? "agora-line-check" : "agora-line-file"}
            dimensions="m"
            aria-hidden
            className="fill-primary-600"
          />
        </div>
        {!isLast && (
          <svg
            className="mt-8 hidden flex-1 stroke-neutral-400 md:block"
            width="12"
            height="100%"
            preserveAspectRatio="none"
            aria-hidden
          >
            <line
              x1="6"
              y1="2"
              x2="6"
              y2="100%"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="0 12"
            />
          </svg>
        )}
      </div>
      <div
        className={`mt-2 flex flex-1 flex-col gap-32 md:max-w-[600px] ${
          steps.length === 0 ? "mb-56" : ""
        }`}
      >
        <div className="flex flex-col gap-8">
          <Typograph tag="h3" className="text-l-bold text-white">
            {title}
          </Typograph>
          <div className="flex flex-wrap gap-16">
            <Typograph tag="span" className="text-s-semibold text-white first-letter:uppercase">
              {`${t(isComplete ? "prr.dimensions.completedIn" : "prr.dimensions.until")} ${dateLabel}`}
            </Typograph>
            {interventions !== null && (
              <Typograph tag="span" className="text-s-regular text-neutral-400">
                {t("prr.dimensions.currentInterventions", {
                  count: formatNumber(interventions, { thousandsSeparator: " " }),
                })}
              </Typograph>
            )}
          </div>
        </div>
        <Typograph tag="p" className="text-m-regular whitespace-pre-line text-white">
          {description}
        </Typograph>
        {steps.length > 0 && (
          <div
            className="relative mb-8 ml-4 w-full md:mb-64 md:max-w-[560px] xl:w-full"
            role="img"
            aria-label={timelineAriaLabel}
          >
            <div className="relative" aria-hidden>
              <div className="relative h-32">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className="absolute -translate-x-1/2 text-s-regular text-neutral-500"
                    style={{ left: `${stepPosition(index)}%` }}
                  >
                    {step.year}
                  </div>
                ))}
              </div>
              <div className="relative h-32">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className="absolute -translate-x-1/2 text-s-regular text-white"
                    style={{ left: `${stepPosition(index)}%` }}
                  >
                    {formatValue(step.value)}
                  </div>
                ))}
              </div>
              <div className="relative mb-8 h-24">
                <div
                  className={`absolute pr-2 text-m-semibold text-white ${
                    isNearStart ? "" : "-translate-x-full"
                  }`}
                  style={{ left: `${clampedPercentage}%` }}
                >
                  {Math.min(displayedPercentage, 100)}%
                </div>
              </div>
              <div className="h-[60px] bg-primary-300">
                <Bar
                  data={{
                    labels: [""],
                    datasets: [
                      {
                        data: [clampedPercentage],
                        backgroundColor: readCssVar("--color-primary-400"),
                        barThickness: 60,
                        borderRadius: 0,
                        borderSkipped: false,
                      },
                    ],
                  }}
                  options={{
                    indexAxis: "y",
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: { enabled: false },
                    },
                    scales: {
                      x: { display: false, min: 0, max: 100 },
                      y: { display: false },
                    },
                    animation: { duration: 1000, easing: "easeOutQuart" },
                  }}
                />
              </div>
              {isObjectiveExceeded && (
                <div className="mt-32 flex items-center gap-8 text-white">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border border-success-300">
                    <Icon
                      name="agora-line-check"
                      dimensions="s"
                      aria-hidden
                      className="fill-success-300"
                    />
                  </div>
                  <Typograph tag="span" className="text-s-regular text-white">
                    {t("prr.dimensions.milestoneObjectiveExceeded")}
                  </Typograph>
                  {displayedPercentage > 100 && (
                    <Typograph tag="span" className="text-s-regular text-neutral-400">
                      {t("prr.dimensions.milestoneCurrentlyAt", {
                        percentage: displayedPercentage.toLocaleString(i18n.language),
                      })}
                    </Typograph>
                  )}
                </div>
              )}
            </div>
            {/* Dashed guide lines under each step */}
            <div
              className="pointer-events-none absolute top-64 right-0 left-0 h-[92px]"
              aria-hidden
            >
              {steps.map((_, index) => (
                <div
                  key={index}
                  className="absolute h-full border-l border-dashed border-neutral-400"
                  style={{ left: `${stepPosition(index)}%` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
