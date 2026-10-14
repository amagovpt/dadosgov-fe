"use client";

import IconComponent from "@/components/Primitives/IconComponent";
import { Typograph } from "@/components/Shared/Generics/Typograph";
import { Tooltip } from "@ama-pt/agora-design-system";
import { twJoin, twMerge } from "tailwind-merge";

export interface ISheetBenProjItem {
  title: string;
  value: string;
  tooltipText?: string;
  isSummary?: boolean;
  className?: string;
}

export default function SheetBenProjItem({
  title,
  value,
  tooltipText,
  isSummary = false,
  className,
}: ISheetBenProjItem) {
  return (
    <div className={twMerge("w-full py-16 flex flex-col gap-16", className)}>
      <div className="flex items-center gap-16">
        <Typograph tag="p" className="text-m-bold text-neutral-900">
          {title}
        </Typograph>
        {tooltipText && (
          <Tooltip
            description={tooltipText}
            position="top"
            alignment="center"
            variant="light"
          >
            <IconComponent
              name="agora-line-info-mark"
              dimensions="m"
              color="primary-600"
            />
          </Tooltip>
        )}
      </div>
      <Typograph
        tag="p"
        className={twJoin(
          "text-primary-900",
          isSummary ? "text-m-regular" : "text-xl-light",
        )}
      >
        {value}
      </Typograph>
    </div>
  );
}
