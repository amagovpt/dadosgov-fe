import { ReactNode } from "react";

export type DataFieldWrapperI = {
  label: string;
  value: ReactNode;
};

export default function DataFieldWrapper({ label, value }: DataFieldWrapperI) {
  return (
    <div className="flex w-full flex-col gap-16">
      <div className="flex flex-col gap-8">
        <p className="text-m-medium text-primary-900">{label}</p>
        <p className="text-m-regular text-neutral-900">{value}</p>
      </div>
      <div className="h-px w-full bg-neutral-700" />
    </div>
  );
}
