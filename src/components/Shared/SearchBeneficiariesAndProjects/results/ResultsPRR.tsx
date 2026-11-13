"use client";

import { useSearchBenProjStore } from "@/hooks/useSearchBenProj";
import { formatByThree } from "@/utils/formatByThree";
import { formatCurrency } from "@/utils/formatCurrency";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { type INoResults, ResultsLayout } from "./ResultsShared";
import {
  BodySectionContainer,
  CardDescription,
  CardGeneralV2,
  CardTitle,
  HeaderSectionContainer,
} from "@ama-pt/agora-design-system";
import { Typograph } from "../../Generics/Typograph";

export type { INoResults } from "./ResultsShared";

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
        const normalizedRole = String(item.entityRole ?? "")
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .toLowerCase();
        const isPartner = normalizedRole.includes("partner") || normalizedRole.includes("parceir");

        // one entry per role with an amount; an empty list means the value row is hidden
        let values: string[] = [];
        if (!isPartner && !showOnlyPartners) {
          const roleValues = [
            {
              label: t("searchBenProj.roles.intermediateBeneficiary"),
              value: Number(item[roleKeys.intermediateBeneficiaries] ?? 0),
            },
            {
              label: t("searchBenProj.roles.beneficiary"),
              value: Number(item[roleKeys.beneficiaries] ?? 0),
            },
            {
              label: t("searchBenProj.roles.supplier"),
              value: Number(item[roleKeys.suppliers] ?? 0),
            },
            {
              label: t("searchBenProj.roles.partner"),
              value: Number(item[roleKeys.partners] ?? 0),
            },
          ];
          values = roleValues
            .filter(({ value }) => value > 0)
            .map(({ label, value }) => `${label} ${formatCurrency(value, t)}`);

          // no per-role breakdown: fall back to the entity total, unless the amount is a partner
          if (values.length === 0 && Number(item[roleKeys.partners] ?? 0) === 0) {
            values = [formatCurrency(Number(item[valueKey] ?? 0), t)];
          }
        }


        return (
          <CardGeneralV2
            key={`beneficiary-${String(item.entityNif ?? "")}-${index}`}
            layout="text"
            className=""
            sideAnchor={{
              href: `${pathname}/${encodeURIComponent(String(item.entityNif ?? ""))}`,
              target: "_blank",
              children: "",
            }}
          >
            <HeaderSectionContainer>
              <CardTitle>{title}</CardTitle>
            </HeaderSectionContainer>
            <BodySectionContainer className="mt-8">
              <CardDescription className="flex flex-col gap-24">
                <div className="flex flex-col">
                  <Typograph
                    tag="p"
                    className="text-m-regular text-neutral-900 first-letter:uppercase"
                  >
                    <strong>{t("nif")}</strong> {formatByThree(String(item.entityNif ?? ""))}
                  </Typograph>
                  <Typograph tag="p" className="text-m-regular text-neutral-900">
                    {String(item.projectsAmount ?? 0)} {projectLabel}
                  </Typograph>
                </div>
                {values.length > 0 && (
                  <div className="flex flex-row flex-wrap gap-16">
                    <Typograph
                      tag="p"
                      className="text-m-bold text-neutral-900 first-letter:uppercase"
                    >
                      {valueLabel}
                    </Typograph>
                    {values.map((value) => (
                      <Typograph key={value} tag="p" className="text-m-regular text-neutral-900">
                        {value}
                      </Typograph>
                    ))}
                  </div>
                )}
              </CardDescription>
            </BodySectionContainer>
          </CardGeneralV2>
        );
      })}
    </ResultsLayout>
  );
}
