import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export type DataFieldWrapperI = {
  label: string;
  value: ReactNode;
  className?: string;
};

export default function DataFieldWrapper({ label, value, className }: DataFieldWrapperI) {
  return (
    <div className={twMerge("flex w-full flex-col gap-16", className)}>
      <div className="flex flex-col gap-8">
        <p className="text-m-medium text-primary-900">{label}</p>
        <p className="text-m-regular text-neutral-900">{value}</p>
      </div>
      <div className="h-px w-full bg-neutral-700" />
    </div>
  );
}
