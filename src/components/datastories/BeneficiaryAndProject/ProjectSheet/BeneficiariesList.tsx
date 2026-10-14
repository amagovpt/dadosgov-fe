"use client";
import { useTranslation } from "react-i18next";
import { useCallback, useState } from "react";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import { formatCompactEUR } from "@/utils/formatCurrency";
import { PT2030ProjectSheetBeneficiary } from "@/service/types/datastories/pt2030/pt2030";
import CardGeneral from "@/components/Primitives/Cards/CardGeneral";
import { LoadMoreWrapper } from "@/components/Shared/Wrappers/LoadMoreWrapper";

type BeneficiaryType = "MAIN" | "MORE";

export interface IProjectsByEntityList {
  projectCode: string;
  beneficiaryType: BeneficiaryType;
  data: PT2030ProjectSheetBeneficiary[];
  limit?: number;
}

export default function BeneficiariesList({
  projectCode,
  beneficiaryType,
  data,
  limit = 4,
}: IProjectsByEntityList) {
  const { i18n, t } = useTranslation();

  const [totalItems, setTotalItems] = useState<number | undefined>(
    data.length < limit ? data.length : undefined,
  );

  const handleLoadMore = useCallback(
    async (page: number) => {
      const res = await fetch(
        `/api/fundos-europeus/pt2030/beneficiarios-e-projetos/ficha-de-projeto`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ projectCode, beneficiaryType, limit, page }),
        },
      );

      if (!res.ok) {
        throw new Error(
          `Failed to load more Projects by Entity: ${res.status}`,
        );
      }

      const resObj = await res.json();

      if ("total" in resObj) {
        setTotalItems(resObj.total);
      }

      return resObj.data;
    },
    [projectCode, beneficiaryType, limit],
  );

  const formatValuesWithSuffix = (value: number | string) => {
    const [finValue, finSuffix] = formatCompactEUR(Number(value));
    return `${finValue} ${t(finSuffix)} €`;
  };

  return (
    <LoadMoreWrapper
      initialItems={data || []}
      totalItems={totalItems}
      onLoadMore={handleLoadMore}
      seeMoreText={t("beneficiaries").toLowerCase()}
      renderItem={(beneficiary, index) => {
        const valueStr = `<strong>${t("financingValue")}</strong> ${formatValuesWithSuffix(beneficiary.financingAmount)}`;
        const descStr = `<p>${valueStr}</p>`;

        const description = formatHtmlParagraphs(
          descStr,
          "text-m-regular !text-neutral-900 first-letter:uppercase",
        );

        const href = `/${i18n.language}/fundos-europeus/portugal-2030/beneficiarios-e-projetos/pesquisar-beneficiarios/${beneficiary.entityNif}`;

        return (
          <CardGeneral
            key={`card-${beneficiaryType}-${index}`}
            titleText={beneficiary.name}
            descriptionText={description as unknown as string}
            anchor={{
              children: "",
              href: href,
              hasIcon: true,
            }}
            isCardHorizontal
            isBlockedLink
          />
        );
      }}
      className="grid grid-cols-2 gap-32 load-more-list"
    />
  );
}
