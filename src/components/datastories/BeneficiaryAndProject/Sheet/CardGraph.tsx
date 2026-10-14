"use client";

import { twMerge } from "tailwind-merge";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import DonutCard from "@/components/Primitives/Cards/DonutCard";

interface ICardGraph {
  description: string;
  graphValue: number;
  graphVariant?: "solid" | "hatched";
  className?: string;
  classNameDescription?: string;
}

export default function CardGraph({
  description,
  graphValue,
  graphVariant,
  className,
  classNameDescription,
}: ICardGraph) {
  return (
    <div className={twMerge("w-full h-auto flex flex-col gap-32", className)}>
      {formatHtmlParagraphs(
        description,
        twMerge("text-m-regular text-primary-900", classNameDescription),
      )}

      <div className="flex flex-row gap-16">
        <DonutCard
          textColor={"primary-900"}
          percentual={graphValue}
          color={"#034AD8"}
          secondaryColor={"#FFFFFF"}
          variant={graphVariant}
          aria-hidden
        />
      </div>
    </div>
  );
}
