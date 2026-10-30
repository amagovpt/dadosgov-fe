import { formatByThree } from "@/utils/formatByThree";
import { BenProjSheet } from "../../BeneficiaryAndProject/Sheet";

type BeneficiarySheetViewData = {
  budget: number;
  name: string;
  nif: string;
  economicActivity: string | null;
  location: string | null;
  totalProjects: number;
};

type BeneficiarySheetContentProps = {
  beneficiaryData: BeneficiarySheetViewData;
  formatValuesWithSuffix: (value: number | string) => string;
  labels: {
    name: string;
    financedValue: string;
    totalProjects: string;
    taxId: string;
    economicActivity: string;
    headquartersLocation: string;
    financedValueTooltip: string;
  };
};

export default function BeneficiarySheetContent({
  beneficiaryData,
  formatValuesWithSuffix,
  labels,
}: BeneficiarySheetContentProps) {
  return (
    <BenProjSheet.Root>
      <div className="grid w-full grid-cols-1 gap-x-32 xl:grid-cols-2">
        <BenProjSheet.Item title={labels.name} value={beneficiaryData.name} />
        <div className="grid grid-cols-1 gap-x-32 md:grid-cols-2">
          <BenProjSheet.Item
            title={labels.financedValue}
            value={formatValuesWithSuffix(beneficiaryData.budget)}
            tooltipText={labels.financedValueTooltip}
          />
          <BenProjSheet.Item
            title={labels.totalProjects}
            value={String(beneficiaryData.totalProjects ?? 0)}
          />
        </div>

        <BenProjSheet.Item
          title={labels.taxId}
          value={formatByThree(beneficiaryData.nif)}
          className="border-t-2 border-b-2 border-t-neutral-200 border-b-neutral-200"
        />
        <div className="grid grid-cols-1 gap-x-32 border-t-2 border-b-2 border-t-neutral-200 border-b-neutral-200 md:grid-cols-2">
          <BenProjSheet.Item
            title={labels.economicActivity}
            value={beneficiaryData.economicActivity ?? ""}
          />
          <BenProjSheet.Item
            title={labels.headquartersLocation}
            value={beneficiaryData.location ?? ""}
          />
        </div>
      </div>
    </BenProjSheet.Root>
  );
}
