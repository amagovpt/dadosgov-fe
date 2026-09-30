import { Typograph } from "@/components/Shared/Generics/Typograph";
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
        <Typograph tag="p" className="text-m-medium wrap-break-word text-primary-900">
          {label}
        </Typograph>
        <Typograph tag="p" className="text-m-regular wrap-break-word text-neutral-900">
          {value}
        </Typograph>
      </div>
      <div className="h-px w-full bg-neutral-700" />
    </div>
  );
}
