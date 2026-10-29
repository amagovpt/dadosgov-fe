"use client";

import { useSearchBenProjStore } from "@/hooks/useSearchBenProj";
import { formatByThree } from "@/utils/formatByThree";
import { formatCurrency } from "@/utils/formatCurrency";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { type INoResults, ResultCard, ResultsLayout } from "./ResultsShared";

export type { INoResults } from "./ResultsShared";

// There is no PRR beneficiary sheet yet, so the cards do not navigate
const PRR_CARD_LINKS_ENABLED = false;

const ROLE_VALUE_KEYS = {
  financed: {
    intermediateBeneficiaries: "approvedValueIntermediateBeneficiaries",
    beneficiaries: "approvedValueBeneficiaries",
    suppliers: "approvedValueSuppliers",
    partners: "approvedValuePartners",
  },
  paid: {
    intermediateBeneficiaries: "paidValueIntermediateBeneficiaries",
    beneficiaries: "paidValueBeneficiaries",
    suppliers: "paidValueSuppliers",
    partners: "paidValuePartners",
  },
} as const;

export default function ResultsPRR({ noResults }: { noResults?: INoResults }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const indicator = useSearchBenProjStore((state) => state.indicator);
  const data = useSearchBenProjStore((state) => state.data);
  const appliedFilters = useSearchBenProjStore((state) => state.appliedFilters);

  // partners have no amount of their own, so their cards show only the NIF and projects
  const showOnlyPartners =
    Boolean(appliedFilters.partner) &&
    !appliedFilters.intermediaryBeneficiary &&
    !appliedFilters.beneficiary &&
    !appliedFilters.supplier;
  const isPaid = indicator === "paid";
  const roleKeys = ROLE_VALUE_KEYS[isPaid ? "paid" : "financed"];
  const valueKey = isPaid ? "paidValue" : "approvedValue";
  const valueLabel = t(isPaid ? "paidValuePrr" : "fundingAmount");

  return (
    <ResultsLayout noResults={noResults}>
      {data.map((item, index) => {
        const title = String(item.entityName ?? "");
        const projectLabel =
          item.projectsAmount === 1 ? t("searchBenProj.project") : t("searchBenProj.projects");
        let description = [
          "<p>",
          `<strong>${t("nif")}</strong> ${formatByThree(String(item.entityNif ?? ""))}`,
          `<br>${String(item.projectsAmount ?? 0)} ${projectLabel}`,
        ].join("");

        const normalizedRole = String(item.entityRole ?? "")
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .toLowerCase();
        const isPartner = normalizedRole.includes("partner") || normalizedRole.includes("parceir");

        if (!isPartner && !showOnlyPartners) {
          const values: string[] = [];
          const intermediateValue = Number(item[roleKeys.intermediateBeneficiaries] ?? 0);
          const beneficiaryValue = Number(item[roleKeys.beneficiaries] ?? 0);
          const supplierValue = Number(item[roleKeys.suppliers] ?? 0);

          if (intermediateValue > 0) {
            values.push(
              `${t("searchBenProj.roles.intermediateBeneficiary")} ${formatCurrency(intermediateValue, t)}`
            );
          }
          if (beneficiaryValue > 0) {
            values.push(
              `${t("searchBenProj.roles.beneficiary")} ${formatCurrency(beneficiaryValue, t)}`
            );
          }
          if (supplierValue > 0) {
            values.push(`${t("searchBenProj.roles.supplier")} ${formatCurrency(supplierValue, t)}`);
          }

          if (values.length > 0) {
            description += `<br><br><strong>${valueLabel}</strong>   ${values.join("   ")}`;
          } else if (Number(item[roleKeys.partners] ?? 0) === 0) {
            description += `<br><br><strong>${valueLabel}</strong>   ${formatCurrency(Number(item[valueKey] ?? 0), t)}`;
          }
        }

        description += "</p>";

        return (
          <ResultCard
            key={`beneficiary-${String(item.entityNif ?? "")}-${index}`}
            title={title}
            description={description}
            href={`${pathname}/${encodeURIComponent(String(item.entityNif ?? ""))}`}
            isLast={index === data.length - 1}
            linkEnabled={PRR_CARD_LINKS_ENABLED}
          />
        );
      })}
    </ResultsLayout>
  );
}
