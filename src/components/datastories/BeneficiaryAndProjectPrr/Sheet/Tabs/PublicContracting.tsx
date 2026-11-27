"use client";

import { BenProjSheet } from "@/components/datastories/BeneficiaryAndProject/Sheet";
import { Typograph } from "@/components/Shared/Generics/Typograph";
import {
  ProjectSheetContestAndContractsTab,
  ProjectSheetContractsTab,
} from "@/service/types/datastories/prr/prr";
import { Card } from "@/service/types/shared/common";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import { useTranslation } from "react-i18next";

export interface IBenProjSheetTabPublicContractingPRR {
  title: string;
  description?: string | null;
  publicContracting?: Card[];
  publicContractingData?: ProjectSheetContractsTab | null;
  contestAndContractsData?: ProjectSheetContestAndContractsTab | null;
}

export default function BenProjSheetTabPublicContractingPRR({
  title,
  description,
  publicContractingData,
  contestAndContractsData,
}: IBenProjSheetTabPublicContractingPRR) {
  const { t } = useTranslation();

  const contractDetails =
    publicContractingData?.contractDetails ?? contestAndContractsData?.contractDetails ?? null;
  const detailContracts = contractDetails?.detailContract ?? [];
  const totalContractsValue =
    publicContractingData?.totalContractsValue ?? contractDetails?.contractsValue;
  const contractsCount = publicContractingData?.contractsCount ?? contractDetails?.contractsCount;
  const hasTotalContractsValue = totalContractsValue !== null && totalContractsValue !== undefined;
  const hasContractsCount = contractsCount !== null && contractsCount !== undefined;
  const hasContracts =
    hasTotalContractsValue ||
    hasContractsCount ||
    detailContracts.length > 0 ||
    Boolean(contractDetails?.principalDescription) ||
    Boolean(contractDetails?.secondaryDescription);

  return (
    <div className="flex w-full flex-col gap-32">
      <Typograph tag="h2" className="text-xl-bold text-primary-900">
        {title}
      </Typograph>

      <div className="w-full text-neutral-900 xl:w-1/2">
        {formatHtmlParagraphs(description || "", "w-full text-m-regular text-neutral-900")}
      </div>

      {hasContracts && (
        <div className="flex flex-col gap-32 pt-32">
          <BenProjSheet.Root className="px-0">
            <BenProjSheet.List>
              <BenProjSheet.Wrapper className="border-t-2 border-t-neutral-200">
                <BenProjSheet.Item
                  title={t("prr.sheet.totalContractsValue")}
                  value={hasTotalContractsValue ? formatCurrency(totalContractsValue, t) : "-"}
                />
              </BenProjSheet.Wrapper>
            </BenProjSheet.List>

            <BenProjSheet.List>
              <BenProjSheet.Wrapper className="xl:border-t-2 xl:border-t-neutral-200">
                <BenProjSheet.Item
                  title={t("prr.sheet.totalContracts")}
                  value={hasContractsCount ? String(contractsCount) : "-"}
                />
              </BenProjSheet.Wrapper>
            </BenProjSheet.List>
          </BenProjSheet.Root>

          {contractDetails?.principalDescription && (
            <div className="w-full xl:w-1/2">
              {formatHtmlParagraphs(
                contractDetails.principalDescription,
                "text-m-regular text-neutral-900"
              )}
            </div>
          )}

          {contractDetails?.secondaryDescription && (
            <div className="w-full xl:w-1/2">
              {formatHtmlParagraphs(
                contractDetails.secondaryDescription,
                "text-m-regular text-neutral-900"
              )}
            </div>
          )}

          {detailContracts.length > 0 && (
            <div className="grid grid-cols-1 gap-16 xl:grid-cols-2">
              {detailContracts.map((contract, index) => {
                const content = (
                  <>
                    <Typograph tag="h4" className="text-m-bold text-primary-900">
                      {contract.name ?? "-"}
                    </Typograph>
                    <Typograph tag="p" className="text-s-regular text-neutral-800">
                      {t("prr.sheet.value")}{" "}
                      <span className="text-primary-900">
                        {contract.value !== null && contract.value !== undefined
                          ? formatCurrency(contract.value, t)
                          : "-"}
                      </span>
                    </Typograph>
                  </>
                );

                // without a link the card has no arrow and is not clickable
                return contract.link ? (
                  <BenProjSheet.LinkCard
                    key={`prr-contract-${index}`}
                    href={contract.link}
                    className="gap-8 p-24 pr-64"
                  >
                    {content}
                  </BenProjSheet.LinkCard>
                ) : (
                  <div
                    key={`prr-contract-${index}`}
                    className="flex flex-col gap-8 rounded-4 bg-white p-24 pr-64"
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
