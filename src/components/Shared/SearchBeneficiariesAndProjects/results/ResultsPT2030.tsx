"use client";

import { useSearchBenProjStore } from "@/hooks/useSearchBenProj";
import { formatByThree } from "@/utils/formatByThree";
import { formatCurrency } from "@/utils/formatCurrency";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  buildProjectResult,
  type INoResults,
  ResultCard,
  ResultCardText,
  ResultsLayout,
} from "./ResultsShared";

export type { INoResults } from "./ResultsShared";

export default function ResultsPT2030({ noResults }: { noResults?: INoResults }) {
  const pathname = usePathname();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "en" ? "en" : "pt";
  const subject = useSearchBenProjStore((state) => state.subject);
  const apiRoute = useSearchBenProjStore((state) => state.apiRoute);
  const indicator = useSearchBenProjStore((state) => state.indicator);
  const data = useSearchBenProjStore((state) => state.data);
  const isPrr = apiRoute.includes("/prr/");

  return (
    <ResultsLayout noResults={noResults}>
      {data.map((item, index) => {
        if (subject === "projects") {
          const result = buildProjectResult({
            item,
            indicator,
            pathname,
            t,
            locale,
            financedLabel: isPrr ? "fundingAmount" : "financingValue",
            paidLabel: "paidValue",
          });

          return (
            <ResultCard key={`project-${String(item.operationCode ?? "")}-${index}`} {...result} />
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
        return (
          <ResultCard
            key={`beneficiary-${String(item.entityNif ?? "")}-${index}`}
            title={title}
            href={`${pathname}/${encodeURIComponent(String(item.entityNif ?? ""))}`}
            description={
              <>
                <div className="flex flex-col">
                  <ResultCardText className="first-letter:uppercase">
                    <strong>{t("nif")}</strong> {formatByThree(String(item.entityNif ?? ""))}
                  </ResultCardText>
                  <ResultCardText>
                    {String(item.projectsAmount ?? 0)} {projectLabel}
                  </ResultCardText>
                </div>
                <div className="flex flex-row flex-wrap gap-x-16 gap-y-0">
                  <ResultCardText className="text-m-bold first-letter:uppercase">
                    {valueLabel}
                  </ResultCardText>
                  {item.entityRole && <ResultCardText>{String(item.entityRole)}</ResultCardText>}
                  <ResultCardText>{formatCurrency(Number(item[valueKey] ?? 0), t)}</ResultCardText>
                </div>
              </>
            }
          />
        );
      })}
    </ResultsLayout>
  );
}
