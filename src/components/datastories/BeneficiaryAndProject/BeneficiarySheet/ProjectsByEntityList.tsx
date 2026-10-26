"use client";
import { useTranslation } from "react-i18next";
import { useCallback, useState } from "react";
import { formatCompactEUR } from "@/utils/formatCurrency";
import { PT2030ProjectsByBeneficiary } from "@/service/types/datastories/pt2030/pt2030";
import { LoadMoreWrapper } from "@/components/Shared/Wrappers/LoadMoreWrapper";
import { ResultCard } from "@/components/Shared/SearchBeneficiariesAndProjects/results/ResultsShared";

type EntityRole = "BENEFICIARIO_PRINCIPAL" | "OUTROS_BENEFICIARIOS";

export interface IProjectsByEntityList {
  nif: string;
  entityRole: EntityRole;
  data: PT2030ProjectsByBeneficiary[];
  total?: number;
}

export default function ProjectsByEntityList({
  nif,
  entityRole,
  data,
  total,
}: IProjectsByEntityList) {
  const { i18n, t } = useTranslation();

  const [totalItems, setTotalItems] = useState<number | undefined>(total);

  const handleLoadMore = useCallback(
    async (page: number) => {
      const res = await fetch(
        `/internal-api/fundos-europeus/pt2030/beneficiarios-e-projetos/ficha-de-beneficiario`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ nif, entityRole, page }),
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
    [nif, entityRole]
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

        const href = `/${i18n.language}/datastories/portugal-2030/projetos-do-portugal-2030/${project.operationCode}`;

        return (
          <ResultCard
            key={`card-${entityRole.replaceAll(" ", "-")}-${index}`}
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
