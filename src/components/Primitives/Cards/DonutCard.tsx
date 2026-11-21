import { twJoin } from "tailwind-merge";
import Donut from "../Charts/Donut";
import { formatNumber } from "@/utils/formatNumber";

export default function DonutCard({
  percentual,
  color,
  secondaryColor,
  variant,
  textColor,
}: {
  percentual?: number;
  color?: string;
  secondaryColor?: string;
  variant?: "solid" | "hatched";
  textColor?: string;
}) {
  const formattedPercentual = formatNumber(percentual ?? 0, { fractionDigits: 1 });

  return (
    <div
      className="flex h-full w-full flex-row items-center gap-24"
      data-testid="donut-card"
      style={{ pointerEvents: "none" }}
    >
      <Donut
        percentual={percentual}
        color={color}
        secondaryColor={secondaryColor}
        variant={variant}
      />
      <div className="w-ful flex items-end gap-8">
        <span className={twJoin("text-3xl-bold", textColor)}>{formattedPercentual}</span>
        <span className="pb-8 text-xl-regular">%</span>
      </div>
    </div>
  );
}
