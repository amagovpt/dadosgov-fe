import { InfoBlock } from "@/components/Shared/InfoBlock";
import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export interface ISheetBenProjRoot {
  className?: string;
  classNameList?: string;
  children: ReactNode;
}

export default function SheetBenProjRoot({
  className,
  classNameList,
  children,
}: ISheetBenProjRoot) {
  return (
    <InfoBlock.Root
      className={twMerge("justify-center items-center", className)}
    >
      <div
        className={twMerge(
          "w-full flex flex-col xl:flex-row gap-32",
          classNameList,
        )}
      >
        {children}
      </div>
    </InfoBlock.Root>
  );
}
