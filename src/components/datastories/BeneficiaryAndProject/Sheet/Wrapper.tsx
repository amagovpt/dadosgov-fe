import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export interface ISheetBenProjWrapper {
  className?: string;
  children: ReactNode;
}

export default function SheetBenProjWrapper({
  className,
  children,
}: ISheetBenProjWrapper) {
  return (
    <div
      className={twMerge(
        "w-full flex flex-col xl:flex-row gap-32 border-b-2 border-b-neutral-200",
        className,
      )}
    >
      {children}
    </div>
  );
}
