"use client";

import CardGeneral from "@/components/Primitives/Cards/CardGeneral";
import { useSearchBenProjStore } from "@/hooks/useSearchBenProj";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import type { TFunction } from "i18next";
import Image from "next/image";
import { type MouseEvent, type ReactNode, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Typograph } from "../../Generics/Typograph";
import ResultsNumber from "./ResultsNumber";
import useMobile from "@/hooks/useMobile";
import { formatCurrency } from "@/utils/formatCurrency";
import { useLoader } from "@/hooks/useLoader";
import { getAssets } from "@/utils/getAssets";

export interface INoResults {
  image: string;
  imageWidth?: number;
  imageHeight?: number;
  title: string;
  description: string;
}

type ResultCardProps = {
  title: string;
  description: string;
  href: string;
  isLast: boolean;
  linkEnabled?: boolean;
};

type ProjectResultOptions = {
  item: Record<string, string | number | object>;
  indicator: string;
  pathname: string;
  t: TFunction;
  financedLabel: string;
  paidLabel: string;
};

function NoResults({
  image,
  imageWidth = 176,
  imageHeight = 168,
  title,
  description,
}: INoResults) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-32 items-center xl:pt-32">
      {image && (
        <Image
          src={getAssets(image)}
          alt={t("noResults")}
          width={imageWidth}
          height={imageHeight}
          priority
          fetchPriority="high"
        />
      )}
      <div className="flex flex-col gap-16 text-center">
        <Typograph tag="h2" className="text-xl-light">
          {title}
        </Typograph>
        <Typograph tag="div" className="text-m-regular">
          {formatHtmlParagraphs(description)}
        </Typograph>
      </div>
    </div>
  );
}

export function ResultsLine() {
  return <div className="h-px w-full bg-neutral-700" />;
}

export function ResultsLayout({
  noResults,
  children,
}: {
  noResults?: INoResults;
  children: ReactNode;
}) {
  const { showLoader, hideLoader } = useLoader();
  const isMobile = useMobile();
  const loading = useSearchBenProjStore((state) => state.loading);
  const data = useSearchBenProjStore((state) => state.data);
  const showFilters = useSearchBenProjStore((state) => state.showFilters);

  useEffect(() => {
    if (loading) showLoader();
    else hideLoader();
  }, [loading, showLoader, hideLoader]);

  if (!loading && data.length === 0) {
    return noResults ? <NoResults {...noResults} /> : null;
  }

  return (
    <div className="flex flex-col gap-32 results-list">
      {!isMobile && <ResultsNumber />}
      {!isMobile && showFilters.length > 0 && <ResultsLine />}
      {children}
    </div>
  );
}

export function ResultCard({
  title,
  description,
  href,
  isLast,
  linkEnabled = true,
}: ResultCardProps) {
  const formattedDescription = formatHtmlParagraphs(
    description,
    "text-m-regular !text-neutral-900 first-letter:uppercase",
  );
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!linkEnabled) event.preventDefault();
  };

  return (
    <>
      <div className="relative">
        <a
          href={href}
          className="absolute inset-0 z-10"
          aria-label={title}
          tabIndex={-1}
          onClick={handleClick}
        />
        <CardGeneral
          isCardHorizontal
          titleText={title}
          descriptionText={formattedDescription as unknown as string}
          anchor={{
            children: "",
            href,
            hasIcon: true,
            onClick: handleClick,
          }}
        />
      </div>
      {!isLast && <ResultsLine />}
    </>
  );
}

export function buildProjectResult({
  item,
  indicator,
  pathname,
  t,
  financedLabel,
  paidLabel,
}: ProjectResultOptions) {
  const title = String(item.operationName ?? "");
  const operationCode = String(item.operationCode ?? "");
  const conclusionDate =
    item.effectiveConclusionDate ?? item.plannedConclusionDate ?? "";
  const conclusionLabel = item.effectiveConclusionDate
    ? "conclusionDate"
    : "plannedConclusionDate";
  const valueKey =
    indicator === "financed"
      ? "approvedValue"
      : indicator === "executed"
        ? "executedValue"
        : "paidValue";
  const valueLabel =
    indicator === "financed"
      ? financedLabel
      : indicator === "executed"
        ? "executedAmount"
        : paidLabel;

  const description = [
    "<p>",
    `<strong>${t("operationCode")}</strong>   ${operationCode}`,
    `<br><strong>${t(conclusionLabel)}</strong>   ${String(conclusionDate)}`,
    `<br><br><strong>${t(valueLabel)}</strong>   ${formatCurrency(Number(item[valueKey] ?? 0), t)}`,
    "</p>",
  ].join("");

  return {
    title,
    description,
    href: `${pathname}/${encodeURIComponent(operationCode)}`,
  };
}
