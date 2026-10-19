import { twMerge } from "tailwind-merge";
import { useMemo } from "react";
import { Typograph } from "@/components/Shared/Generics/Typograph";
import { highlightFirstWord } from "@/utils/highlightFirstWord";

interface IBigValue {
  label: string;
  value: string;
  isReversed?: boolean;
  className?: string;
}

export default function BigValue({
  label,
  value,
  isReversed = false,
  className,
}: IBigValue) {
  const formatedValue = useMemo(() => {
    return highlightFirstWord(value, "text-3xl-bold");
  }, [value]);

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
      <Typograph tag="p" className="text-xl-regular text-neutral-900">
        {formatedValue}
      </Typograph>
    </div>
  );
}
