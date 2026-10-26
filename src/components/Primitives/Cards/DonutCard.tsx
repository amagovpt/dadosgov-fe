import { twJoin } from "tailwind-merge";
import Donut from "../Charts/Donut";

export default function DonutCard({
  percentual,
  color,
  secondaryColor,
  variant,
  textColor
}: {
  percentual?: number;
  color?: string;
  secondaryColor?: string;
  variant?: "solid" | "hatched";
  textColor?: string;
}) {
  const formattedPercentual =
    typeof percentual === "number" ? percentual.toLocaleString("pt-PT") : "";

  return (
    <div className="w-full h-full flex flex-row  items-center gap-24 " data-testid="donut-card" style={{ pointerEvents: 'none' }}>
      <Donut percentual={percentual} color={color} secondaryColor={secondaryColor} variant={variant} />
      <div className="w-ful flex gap-8 items-end ">
        <span className={twJoin("text-3xl-bold", textColor)}>
          {formattedPercentual}
        </span>
        <span className="text-xl-regular pb-8">%</span>
      </div>
    </div>
  );
}
