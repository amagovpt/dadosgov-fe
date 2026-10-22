"use client";

import React from "react";
import { Typograph } from "@/components/Shared/Generics/Typograph";
import dayjs from "dayjs";
import { Anchor } from "@ama-pt/agora-design-system";
import { twMerge } from "tailwind-merge";
import { TechnicalSheetModalData } from "@/service/types/modal/technical-sheet";
import { Modal } from "../Modal";
import TechnicalSheetModalContent from "../Modal/TechnicalSheetModalContent";
import { useTranslation } from "react-i18next";

export interface SourceInfoFooterProps {
  dataSource: string | React.ReactNode;
  update: string;
  download?: string;
  technicalSheet?: TechnicalSheetModalData;
  className?: string;
}

export function SourceInfoFooter({
  dataSource,
  update,
  download,
  technicalSheet,
  className,
}: SourceInfoFooterProps) {
  const { t } = useTranslation("common");

  return (
    <div
      className={twMerge(
        "flex w-full flex-wrap items-center justify-start gap-16 text-m-regular text-neutral-700",
        className
      )}
    >
      <Typograph tag="p" className="flex items-center gap-8 text-neutral-700">
        Fonte <span className="text-neutral-900">{dataSource}</span>
      </Typograph>
      {download && (
        <div className="flex items-center gap-8">
          <Typograph tag="p" className="text-neutral-700">
            Dataset
          </Typograph>
          <Anchor
            variant="neutral"
            href={download}
            className="text-neutral-900! decoration-neutral-900!"
          >
            Descarregar
          </Anchor>
        </div>
      )}
      {technicalSheet && (
        <div className="flex items-center gap-8">
          <Typograph tag="p" className="text-neutral-900">
            {t("consult")}
          </Typograph>
          <Modal.Root>
            <Modal.Trigger content={<TechnicalSheetModalContent data={technicalSheet} />}>
              <Anchor appearance="text" variant="neutral">{t("technicalSheet")}</Anchor>
            </Modal.Trigger>
          </Modal.Root>
        </div>
      )}
      {update && (
        <Typograph tag="p" className="flex items-center gap-8 text-neutral-700">
          Atualização <span className="text-neutral-900">{dayjs(update).format("DD.MM.YYYY")}</span>
        </Typograph>
      )}
    </div>
  );
}
