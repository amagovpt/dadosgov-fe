"use client";

import { useTranslation } from "react-i18next";
import { useSearchBenProjStore } from "@/hooks/useSearchBenProj";
import { ChangeEvent, useCallback } from "react";
import GroupTitle from "./GroupTitle";
import RadioButtonGroup, { RadioButtonOption } from "../../RadioButtonGroup";

type IndicatorsProps = {
  includeExecuted?: boolean;
};

type IndicatorOption = RadioButtonOption & {
  value: string;
};

export default function Indicators({
  includeExecuted = true,
}: IndicatorsProps) {
  const { t } = useTranslation();
  const { indicator, setIndicator, apiRoute, subject } = useSearchBenProjStore(
    (state) => state,
  );
  const isPrr = apiRoute.includes("/plano-de-recuperacao-e-resiliencia/");

  const options: IndicatorOption[] = [
    {
      label: t(isPrr ? "fundingAmount" : "financingValue"),
      value: "financed",
      key: "financed",
    },
  ];

  if (includeExecuted) {
    options.push({
      label: t("executedAmount"),
      value: "executed",
      key: "executed",
    });
  }

  options.push({
    label: t(
      isPrr && subject === "beneficiaries" ? "paidValuePrr" : "paidValue",
    ),
    value: "paid",
    key: "paid",
  });

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setIndicator(event.target.value);
    },
    [setIndicator],
  );

  return (
    <div className="flex flex-col gap-16">
      <GroupTitle title={t("indicators")} />
      <RadioButtonGroup
        options={options}
        value={indicator}
        onChange={handleChange}
        className="flex flex-col gap-16"
      />
    </div>
  );
}
