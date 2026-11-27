import { Typograph } from "@/components/Shared/Generics/Typograph";
import { Card } from "@/service/types/shared/common";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import BeneficiariesList from "../ProjectSheet/BeneficiariesList";

export type Beneficiary = {
  name: string;
  entityNif: string;
  financingAmount: number;
};

export type BenData = {
  main: Beneficiary[];
  more: Beneficiary[];
};

export interface IBenProjSheetTabBeneficiaries {
  title: string;
  beneficiaries: Card[];
  beneficiariesData: BenData;
}

export default function BenProjSheetTabBeneficiaries({
  title,
  beneficiaries,
  beneficiariesData,
}: IBenProjSheetTabBeneficiaries) {
  return (
    <div className="flex w-full flex-col gap-64">
      <Typograph tag="h2" className="text-xl-bold text-primary-900">
        {title}
      </Typograph>

      {(beneficiaries as Card[]).map((ben, index) => {
        const data = beneficiariesData[ben.id === "main" ? "main" : "more"] as Beneficiary[];

        if (!data || data.length === 0) {
          return null; // skip rendering if there is no data for this beneficiary type
        }

        return (
          <div key={`benType-${index}`} className="flex flex-col gap-32">
            <div className="flex flex-col gap-8">
              <Typograph tag="h3" className="text-l-bold text-primary-900">
                {ben.title}
              </Typograph>

              {formatHtmlParagraphs(
                ben.description,
                "w-full xl:w-1/2 text-s-regular text-neutral-800"
              )}
            </div>

            <BeneficiariesList
              projectCode="dummyProjectCode"
              beneficiaryType={ben.id === "main" ? "MAIN" : "MORE"}
              data={data}
              limit={4}
            />
          </div>
        );
      })}
    </div>
  );
}
