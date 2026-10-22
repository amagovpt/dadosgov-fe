"use client";

import Button from "@/components/Primitives/Button";
import { Typograph } from "@/components/Shared/Generics/Typograph";
import { ApplicationTabData } from "@/service/types/datastories/prr/prr";
import { Card } from "@/service/types/shared/common";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

export interface IBenProjSheetTabApplicationPRR {
  title: string;
  description: string;
  application: Card[];
  applicationData: ApplicationTabData;
}

export default function BenProjSheetTabApplicationPRR({
  title,
  description,
  application,
  applicationData,
}: IBenProjSheetTabApplicationPRR) {
  const { t } = useTranslation();
  const routerNav = useRouter();

  const getCard = (index: number) => {
    const item = application[index];
    return item && typeof item === "object" && "title" in item ? item : null;
  };

  const getCardDescription = (card: ReturnType<typeof getCard>) => {
    return card &&
      typeof card === "object" &&
      "description" in card &&
      typeof card.description === "string"
      ? card.description
      : "";
  };

  const callCard = getCard(0);
  const criteriaCard = getCard(1);
  const gradeCard = getCard(2);

  return (
    <div className="flex w-full flex-col gap-32 py-64">
      <Typograph tag="h2" className="text-xl-bold text-primary-900">
        {title}
      </Typograph>

      <div className="grid w-full grid-cols-1 gap-y-64 xl:grid-cols-[592px_minmax(0,1fr)] xl:gap-x-[136px]">
        <div className="flex flex-col gap-32">
          {formatHtmlParagraphs(description, "w-full text-m-regular text-neutral-900")}
        </div>
        <div className="hidden xl:block" />

        <div className="flex flex-col gap-32">
          <Typograph tag="h2" className="text-xl-bold text-primary-900">
            {callCard?.title ?? ""}
          </Typograph>
          {formatHtmlParagraphs(
            getCardDescription(callCard),
            "w-full text-m-regular text-neutral-900"
          )}
        </div>

        <div className="flex w-full flex-col gap-8 xl:pt-[66px]">
          <div className="flex flex-col gap-8">
            <Typograph tag="h3" className="text-m-bold text-primary-900">
              {gradeCard?.title ?? ""}
            </Typograph>
            <Typograph tag="p" className={"text-3xl-bold text-neutral-800"}>
              {applicationData.notaFinal && applicationData.notaFinal.length > 0
                ? applicationData.notaFinal
                : t("sheetBenProj.noGrade")}
            </Typograph>
          </div>
        </div>

        <div className="flex flex-col gap-32">
          <Typograph tag="h2" className="text-xl-bold text-primary-900">
            {criteriaCard?.title ?? ""}
          </Typograph>
          {formatHtmlParagraphs(
            getCardDescription(criteriaCard) || "-",
            "w-full text-m-regular text-neutral-900"
          )}
        </div>

        <div className="flex w-full xl:items-center">
          <Button
            appearance="solid"
            variant="neutral"
            hasIcon
            trailingIcon="agora-line-external-link"
            trailingIconHover="agora-line-external-link"
            className="w-fit!"
            onClick={() => routerNav.push(applicationData.link || "#")}
          >
            {t("prr.sheet.selectionCriteria")}
          </Button>
        </div>
      </div>
    </div>
  );
}
