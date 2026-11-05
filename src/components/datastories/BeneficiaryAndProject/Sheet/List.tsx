import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export interface ISheetBenProjList {
  children: ReactNode;
  className?: string;
}

export default function SheetBenProjList({
  children,
  className,
}: ISheetBenProjList) {
  return (
    <div className={twMerge("w-full flex flex-col gap-16", className)}>
      {children}
    </div>
  );
}
