"use client";

import { Typograph } from "@/components/Shared/Generics/Typograph";
import { Application } from "@/service/types/datastories/pt2030/pt2030";
import { Card } from "@/service/types/shared/common";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import { useTranslation } from "react-i18next";
import { twJoin } from "tailwind-merge";

export interface IBenProjSheetTabApplication {
  title: string;
  description: string;
  application: Card[];
  applicationData: Application;
}

export default function BenProjSheetTabApplication({
  title,
  description,
  application,
  applicationData,
}: IBenProjSheetTabApplication) {
  const { t } = useTranslation();

  return (
    <div className="flex w-full flex-col gap-32 py-64">
      <Typograph tag="h2" className="text-xl-bold text-primary-900">
        {title}
      </Typograph>
      <div className="flex w-full flex-col gap-32 xl:flex-row">
        <div className="flex w-full flex-col gap-32">
          {formatHtmlParagraphs(description, "w-full text-m-regular text-neutral-900")}

          <div className="flex flex-col gap-8">
            <Typograph tag="h3" className="text-l-bold text-primary-900">
              {application[0].title}
            </Typograph>

            <Typograph tag="p" className="text-s-regular text-neutral-900">
              {applicationData.codigo_aviso}
            </Typograph>
          </div>

          <div className="flex flex-col gap-8">
            <Typograph tag="h3" className="text-l-bold text-primary-900">
              {application[1].title}
            </Typograph>

            <Typograph tag="p" className="text-s-regular text-neutral-900">
              {applicationData.criterios_selecao ?? "-"}
            </Typograph>
          </div>
        </div>

        <div className="flex w-full flex-col gap-32">
          <div className="flex flex-col gap-8">
            <Typograph tag="h3" className="text-m-bold text-primary-900">
              {application[2].title}
            </Typograph>

            <Typograph
              tag="p"
              className={twJoin(
                "text-neutral-900",
                applicationData.nota_final ? "text-3xl-regular" : "text-s-regular"
              )}
            >
              {applicationData.nota_final && applicationData.nota_final.length > 0
                ? applicationData.nota_final
                : t("sheetBenProj.noGrade")}
            </Typograph>
          </div>

          <div className="flex flex-col gap-8">
            <Typograph tag="h3" className="text-m-bold text-primary-900">
              {application[3].title}
            </Typograph>

            <Typograph tag="p" className="text-m-regular text-neutral-900">
              {applicationData.designacao_aviso}
            </Typograph>
          </div>
        </div>
      </div>
    </div>
  );
}
