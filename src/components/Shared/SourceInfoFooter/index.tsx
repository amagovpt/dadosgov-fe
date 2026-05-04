"use client";
import React from "react";
import { Typograph } from "../Generics/Typograph";
import dayjs from "dayjs";
import { Anchor } from "@ama-pt/agora-design-system";
import { twMerge } from "tailwind-merge";

export interface SourceInfoFooterProps {
  dataSource: string | React.ReactNode;
  update: string;
  download?: string;
  className?: string;
}

export function SourceInfoFooter({
  dataSource,
  update,
  download,
  className,
}: SourceInfoFooterProps) {

  return (
    <div className={twMerge("w-full flex justify-end items-center flex-wrap text-neutral-700 text-m-regular gap-16", className)}>
      <Typograph tag="p" className="flex gap-8 items-center text-neutral-700">
        Fonte <span className="text-neutral-900">{dataSource}</span>
      </Typograph>
      {update && (
        <Typograph tag="p" className="flex gap-8 items-center text-neutral-700">
          Atualização <span className="text-neutral-900">{dayjs(update).format("DD.MM.YYYY")}</span>
        </Typograph>
      )}
      {download && (
        <div className="flex items-center gap-8">
          <Typograph tag="p" className="text-neutral-700"> 
            Dataset
          </Typograph>
          <Anchor variant="neutral" href={download} className="!text-neutral-900 !decoration-neutral-900 ">
            Descarregar
          </Anchor>
        </div>
      )}
    </div>
  );
}
