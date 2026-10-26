import { Typograph } from "@/components/Shared/Generics/Typograph";
import { twMerge } from "tailwind-merge";

interface IMediumValue {
  label: string;
  value: string;
  isReversed?: boolean;
  className?: string;
}

export default function MediumValue({
  label,
  value,
  isReversed = false,
  className,
}: IMediumValue) {
  return (
    <div
      className={twMerge(
        "w-full flex flex-col gap-0",
        isReversed ? "flex-col-reverse" : "",
        className,
      )}
    >
      <Typograph tag="p" className="text-m-regular text-neutral-900">
        {label}
      </Typograph>
      <Typograph tag="p" className="text-l-semibold text-neutral-900">
        {value}
      </Typograph>
    </div>
  );
}
