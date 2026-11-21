import { useMemo } from "react";
import { twMerge } from "tailwind-merge";
import { highlightFirstWord } from "@/utils/highlightFirstWord";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import { Typograph } from "@/components/Shared/Generics/Typograph";

interface ICardLined {
  title: string;
  description: string;
  className?: string;
}

export default function CardLined({
  title,
  description,
  className,
}: ICardLined) {
  const formatedTitle = useMemo(() => {
    return highlightFirstWord(title, "text-3xl-bold");
  }, [title]);

  return (
    <div
      className={twMerge(
        "w-full h-auto p-32 bg-white border-l-4 border-primary-600 flex flex-col gap-8",
        className,
      )}
    >
      <Typograph tag="p" className="text-xl-regular text-neutral-900">
        {formatedTitle}
      </Typograph>

      {formatHtmlParagraphs(description, "text-m-regular text-neutral-900")}
    </div>
  );
}
