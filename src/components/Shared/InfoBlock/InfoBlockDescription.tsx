"use client";
import { Typograph } from "../Generics/Typograph";
import { twMerge } from "tailwind-merge";

export interface IInfoBlockDescriptionProps {
  description?: string[] | string;
  className?: string;
}

export default function InfoBlockDescription({
  description,
  className,
}: IInfoBlockDescriptionProps) {

  return (
    <div
      className={twMerge(
        "w-full flex flex-col gap-16 text-pretty text-m-regular",
        className
      )}
      data-testid="info-block-description"
    >
      <Typograph tag="p" className="w-full">
        {description}
      </Typograph>
    </div>
  );
}
