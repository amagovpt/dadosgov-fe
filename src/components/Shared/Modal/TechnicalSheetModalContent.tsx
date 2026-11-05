"use client";
import { Button, ButtonProps, useModalContext, Icon } from "@ama-pt/agora-design-system";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import { TechnicalSheetModalData } from "@/service/types/modal/technical-sheet";
import { useTranslation } from "react-i18next";
import { Typograph } from "../Generics/Typograph";

export default function TechnicalSheetModalContent({
  data: { header, dataInfo, body },
}: {
  data: TechnicalSheetModalData;
}) {
  const { hide } = useModalContext();
  const { t } = useTranslation("common");

  const buttonArgs: ButtonProps = {
    appearance: "solid",
    hasIcon: true,
    trailingIcon: "agora-line-arrow-right-circle",
    trailingIconHover: "agora-solid-arrow-right-circle",
    children: t("header.back"),
    darkMode: true,
  };

  return (
    <div className="grid gap-32 pb-32 text-white xs:grid-cols-4 md:grid-cols-6 xl:grid-cols-12">
      <div className="col-span-6 xl:col-start-4">
        <div className="flex flex-col gap-24">
          <Icon
            name={header?.icon || ""}
            dimensions="xxl"
            aria-label=""
            className="fill-primary-400!"
            alt={header?.title || ""}
          />
          <Typograph tag="h3" className="text-2xl-regular">
            {header?.title || ""}
          </Typograph>
        </div>
      </div>
      <div className="col-span-6 xl:col-start-4">
        <Typograph tag="p" className="text-m-regular">
          {header?.description || ""}
        </Typograph>
        <hr aria-hidden className="mt-32 border-t border-neutral-200" />
      </div>
      <div className="col-span-6 grid grid-cols-2 gap-32 xl:col-start-4">
        {dataInfo.map(({ title, description }, index) => (
          <div key={index}>
            <Typograph tag="p" className="pb-8 text-m-bold">
              {title}
            </Typograph>
            {formatHtmlParagraphs(description)}
          </div>
        ))}
        <hr aria-hidden className="col-span-2 border-t border-neutral-200" />
      </div>
      {body.map(({ title, description }) => (
        <div key={title} className="col-span-6 xl:col-start-4">
          <Typograph tag="p" className="pb-8 text-m-bold">
            {title}
          </Typograph>
          {formatHtmlParagraphs(description)}
          <hr aria-hidden className="mt-32 border-t border-neutral-200" />
        </div>
      ))}
      <div className="col-span-6 xl:col-start-4">
        <Button {...buttonArgs} variant="neutral" onClick={hide} />
      </div>
    </div>
  );
}
