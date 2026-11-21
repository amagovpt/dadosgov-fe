"use client";
import { useTranslation } from "react-i18next";
import { useCallback, useState } from "react";
import { formatCompactEUR } from "@/utils/formatCurrency";
import { PT2030ProjectSheetBeneficiary } from "@/service/types/datastories/pt2030/pt2030";
import { LoadMoreWrapper } from "@/components/Shared/Wrappers/LoadMoreWrapper";
import {
  ResultCard,
  ResultCardText,
} from "@/components/Shared/SearchBeneficiariesAndProjects/results/ResultsShared";

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
    data.length < limit ? data.length : undefined
  );

  const handleLoadMore = useCallback(
    async (page: number) => {
      const res = await fetch(
        `/internal-api/fundos-europeus/pt2030/beneficiarios-e-projetos/ficha-de-projeto`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ projectCode, beneficiaryType, limit, page }),
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to load more Projects by Entity: ${res.status}`);
      }

      const resObj = await res.json();

      if ("total" in resObj) {
        setTotalItems(resObj.total);
      }

      return resObj.data;
    },
    [projectCode, beneficiaryType, limit]
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
        const href = `/${i18n.language}/datastories/portugal-2030/beneficiarios-do-portugal-2030/${beneficiary.entityNif}`;

        return (
          <ResultCard
            key={`card-${beneficiaryType}-${index}`}
            title={beneficiary.name}
            href={href}
            description={
              <ResultCardText className="first-letter:uppercase">
                <strong>{t("financingValue")}</strong>{" "}
                {formatValuesWithSuffix(beneficiary.financingAmount)}
              </ResultCardText>
            }
          />
        );
      }}
      className="load-more-list grid grid-cols-2 gap-32"
    />
  );
}
