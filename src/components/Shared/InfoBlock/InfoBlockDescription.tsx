"use client";
import { Typograph } from "@/components/Shared/Generics/Typograph";
import { twMerge } from "tailwind-merge";

export interface IInfoBlockDescriptionProps {
  description?: string[] | string;
  className?: string;
  classNameContent?: string;
}

export default function InfoBlockDescription({
  description,
  className,
  classNameContent,
}: IInfoBlockDescriptionProps) {

  return (
    <div
      className={twMerge(
        "w-full flex flex-col gap-16 text-pretty text-m-regular",
        className
      )}
      data-testid="info-block-description"
    >
      <Typograph tag="div" className={twMerge("w-full", classNameContent)}>
        {description}
      </Typograph>
    </div>
  );
}
