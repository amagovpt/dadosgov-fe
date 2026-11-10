"use client";

import { useTranslation } from "react-i18next";
import { useCallback, useState } from "react";
import { formatCompactEUR } from "@/utils/formatCurrency";
import { LoadMoreWrapper } from "@/components/Shared/Wrappers/LoadMoreWrapper";
import { ResultCard } from "@/components/Shared/SearchBeneficiariesAndProjects/results/ResultsShared";
import { PT2020Projects } from "@/service/types/datastories/pt2020/pt2020";

export interface IProjectsList {
  nif: string;
  data: PT2020Projects[];
  total?: number;
}

export default function ProjectsList({ nif, data, total }: IProjectsList) {
  const { i18n, t } = useTranslation();

  const [totalItems, setTotalItems] = useState<number | undefined>(total);

  const handleLoadMore = useCallback(
    async (page: number) => {
      const res = await fetch(
        `/internal-api/fundos-europeus/pt2020/beneficiarios-e-projetos/ficha-de-beneficiario`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ nif, page }),
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to load more Projects: ${res.status}`);
      }

      const resObj = await res.json();

      if ("total" in resObj) {
        setTotalItems(resObj.total);
      }

      return resObj.data;
    },
    [nif]
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
      seeMoreText={t("projects").toLowerCase()}
      renderItem={(project, index) => {
        const dateStr = project.effectiveConclusionDate
          ? `<strong>${t("conclusionDate")}</strong> ${project.effectiveConclusionDate}`
          : "";
        const valueStr = `<strong>${t("financingValue")}</strong> ${formatValuesWithSuffix(project.approvedValue)}`;
        const descStr = `<p>${dateStr}<br><br>${valueStr}</p>`;

        const href = `/${i18n.language}/datastories/portugal-2020/projetos-do-portugal-2020/${project.operationCode}`;

        return (
          <ResultCard
            key={`card-${index}`}
            title={project.operationName}
            description={descStr}
            href={href}
            isLast={index === data.length - 1}
          />
        );
      }}
      className="load-more-list flex flex-col gap-32"
    />
  );
}
