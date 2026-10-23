"use client";

import { LinkIcon } from "@/components/Primitives/LinkIcon";
import { Typograph } from "@/components/Shared/Generics/Typograph";
import { LoadMoreWrapper } from "@/components/Shared/Wrappers/LoadMoreWrapper";
import {
  FinancialEntity,
  ProjectSheetBeneficiaryFinancingGroup,
  ProjectSheetBeneficiaryFinancingType,
} from "@/service/types/datastories/prr/prr";
import { Card } from "@/service/types/shared/common";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import { useTranslation } from "react-i18next";

export interface IBenProjSheetTabBeneficiariesPRR {
  title: string;
  projectId: string;
  projectCode: string;
  beneficiaries: Card[];
  beneficiaryData: {
    intermediate: ProjectSheetBeneficiaryFinancingGroup;
    beneficiaries: ProjectSheetBeneficiaryFinancingGroup;
    partners: ProjectSheetBeneficiaryFinancingGroup;
    suppliers: ProjectSheetBeneficiaryFinancingGroup;
  };
}

export default function BenProjSheetTabBeneficiariesPRR({
  title,
  projectId,
  projectCode,
  beneficiaries,
  beneficiaryData,
}: IBenProjSheetTabBeneficiariesPRR) {
  const { t } = useTranslation();

  const cards = beneficiaries as Card[];
  const groups = [
    {
      section: cards[0],
      data: beneficiaryData.intermediate,
      type: "intermediate",
      beneficiaryType: "INTERMEDIARY_BENEFICIARY" as ProjectSheetBeneficiaryFinancingType,
    },
    {
      section: cards[1],
      data: beneficiaryData.beneficiaries,
      type: "beneficiaries",
      beneficiaryType: "BENEFICIARY" as ProjectSheetBeneficiaryFinancingType,
    },
    {
      section: cards[2],
      data: beneficiaryData.partners,
      type: "partners",
      beneficiaryType: "PARTNER" as ProjectSheetBeneficiaryFinancingType,
    },
    {
      section: cards[3],
      data: beneficiaryData.suppliers,
      type: "suppliers",
      beneficiaryType: "SUPPLIER" as ProjectSheetBeneficiaryFinancingType,
    },
  ];

  const renderCard = (
    item: FinancialEntity,
    index: number,
    groupType: "intermediate" | "beneficiaries" | "partners" | "suppliers"
  ) => {
    const value = formatCurrency(item.valor_financiamento, t);
    const amountLabel =
      groupType === "intermediate"
        ? t("prr.sheet.contractedFunding")
        : t("sheetBenProj.fields.valor_financiamento");

    return (
      <div
        key={`prr-beneficiaries-card-${groupType}-${index}`}
        className="relative flex flex-col gap-16 rounded-4 bg-white p-32 pr-72"
      >
        <div className="flex flex-col gap-8">
          <Typograph tag="h4" className="text-l-bold text-neutral-900">
            {item.nome}
          </Typograph>
          {groupType !== "partners" && (
            <Typograph tag="p" className="text-m-semibold text-neutral-900">
              {amountLabel} <span className="text-primary-900">{value}</span>
            </Typograph>
          )}
        </div>
        <div className="absolute top-1/2 right-24 -translate-y-1/2">
          <LinkIcon
            title=""
            href="#"
            className="p-0! leading-none!"
            icon={{
              name: "agora-line-arrow-right-circle",
              hoverName: "agora-solid-arrow-right-circle",
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex w-full flex-col gap-64">
      <Typograph tag="h2" className="text-xl-bold text-primary-900">
        {title}
      </Typograph>

      <div className="flex w-full flex-col gap-64">
        {groups.map((group, index) => {
          if (!group.section || group.data.items.length === 0) {
            return null;
          }

          return (
            <div key={`prr-beneficiaries-${index}`} className="flex flex-col gap-32">
              <div className="flex flex-col gap-8">
                <Typograph tag="h3" className="text-l-bold text-primary-900">
                  {group.section.title}
                </Typograph>
                {formatHtmlParagraphs(
                  group.section.description,
                  "w-full xl:w-1/2 text-s-regular text-neutral-800"
                )}
              </div>

              <LoadMoreWrapper
                initialItems={group.data.items}
                totalItems={group.data.totalFiltered || group.data.total}
                seeMoreText={group.section.title.toLowerCase()}
                className="grid-cols-1 xl:grid-cols-2"
                onLoadMore={async (nextPage) => {
                  const res = await fetch(
                    `/internal-api/fundos-europeus/plano-de-recuperacao-e-resiliencia/beneficiarios-e-projetos/pesquisar-projetos/${encodeURIComponent(projectId)}/beneficiary-financing`,
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        beneficiaryType: group.beneficiaryType,
                        page: nextPage,
                        limit: group.data.limit,
                        projectCode,
                      }),
                    }
                  );

                  if (!res.ok) {
                    throw new Error(`Failed to load more beneficiary financing: ${res.status}`);
                  }

                  return res.json();
                }}
                renderItem={(item, itemIndex) =>
                  renderCard(
                    item,
                    itemIndex,
                    group.type as "intermediate" | "beneficiaries" | "partners" | "suppliers"
                  )
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
