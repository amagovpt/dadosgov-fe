"use client";

import { useSearchBenProjStore } from "@/hooks/useSearchBenProj";
import { formatByThree } from "@/utils/formatByThree";
import { formatCurrency } from "@/utils/formatCurrency";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { buildProjectResult, type INoResults, ResultCard, ResultsLayout } from "./ResultsShared";

export type { INoResults } from "./ResultsShared";

export default function ResultsPT2030({ noResults }: { noResults?: INoResults }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const subject = useSearchBenProjStore((state) => state.subject);
  const apiRoute = useSearchBenProjStore((state) => state.apiRoute);
  const indicator = useSearchBenProjStore((state) => state.indicator);
  const data = useSearchBenProjStore((state) => state.data);
  const isPrr = apiRoute.includes("/plano-de-recuperacao-e-resiliencia/");

  return (
    <ResultsLayout noResults={noResults}>
      {data.map((item, index) => {
        if (subject === "projects") {
          const result = buildProjectResult({
            item,
            indicator,
            pathname,
            t,
            financedLabel: isPrr ? "fundingAmount" : "financingValue",
            paidLabel: "paidValue",
          });

          return (
            <ResultCard
              key={`project-${String(item.operationCode ?? "")}-${index}`}
              {...result}
              isLast={index === data.length - 1}
            />
          );
        }

        const title = String(item.entityName ?? "");
        const projectLabel =
          item.projectsAmount === 1 ? t("searchBenProj.project") : t("searchBenProj.projects");
        const valueLabel =
          indicator === "financed"
            ? t(isPrr ? "fundingAmount" : "financingValue")
            : indicator === "executed"
              ? t("executedAmount")
              : t("paidValue");
        const valueKey =
          indicator === "financed"
            ? "approvedValue"
            : indicator === "executed"
              ? "executedValue"
              : "paidValue";
        const description = [
          "<p>",
          `<strong>${t("nif")}</strong> ${formatByThree(String(item.entityNif ?? ""))}`,
          `<br>${String(item.projectsAmount ?? 0)} ${projectLabel}`,
          `<br><br><strong>${valueLabel}</strong>   ${String(item.entityRole ?? "")}`,
          `   ${formatCurrency(Number(item[valueKey] ?? 0), t)}`,
          "</p>",
        ].join("");

        return (
          <ResultCard
            key={`beneficiary-${String(item.entityNif ?? "")}-${index}`}
            title={title}
            description={description}
            href={`${pathname}/${encodeURIComponent(String(item.entityNif ?? ""))}`}
            isLast={index === data.length - 1}
          />
        );
      })}
    </ResultsLayout>
  );
}
