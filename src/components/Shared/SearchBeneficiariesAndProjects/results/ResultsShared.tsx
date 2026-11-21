"use client";

import {
  BodySectionContainer,
  CardDescription,
  CardGeneralV2,
  CardTitle,
  HeaderSectionContainer,
} from "@ama-pt/agora-design-system";
import { useSearchBenProjStore } from "@/hooks/useSearchBenProj";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import type { TFunction } from "i18next";
import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";
import { Typograph } from "../../Generics/Typograph";
import { formatCurrency } from "@/utils/formatCurrency";
import { useLoader } from "@/hooks/useLoader";
import { getAssets } from "@/utils/getAssets";
import { formatDateLong } from "@/utils/formatDate";

export interface INoResults {
  image: string;
  imageWidth?: number;
  imageHeight?: number;
  title: string;
  description: string;
}

type ResultCardProps = {
  title: string;
  description: ReactNode;
  href: string;
  className?: string;
};

type ResultCardTextProps = {
  className?: string;
  children: ReactNode;
};

type ProjectResultOptions = {
  item: Record<string, string | number | object>;
  indicator: string;
  pathname: string;
  t: TFunction;
  locale: "pt" | "en";
  financedLabel: string;
  paidLabel: string;
};

function NoResults({ image, imageWidth = 176, imageHeight = 168, title, description }: INoResults) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-32 xl:pt-32">
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
  const loading = useSearchBenProjStore((state) => state.loading);
  const data = useSearchBenProjStore((state) => state.data);

  useEffect(() => {
    if (loading) showLoader();
    else hideLoader();
  }, [loading, showLoader, hideLoader]);

  if (!loading && data.length === 0) {
    return noResults ? <NoResults {...noResults} /> : null;
  }

  return (
    <div className="results-list flex flex-col gap-32">
      {/*!isMobile && <ResultsNumber />*/}
      {/*!isMobile && showFilters.length > 0 && <ResultsLine /> */}
      {children}
    </div>
  );
}

/**
 * Whole-card link to a result sheet. The bottom border is dropped on the last sibling, so the
 * cards must be direct children of the list container.
 */
export function ResultCard({ title, description, href, className }: ResultCardProps) {
  return (
    <Link href={href} className={twMerge("border-b border-neutral-900 last:border-b-0", className)}>
      <CardGeneralV2 layout="text" sideAnchor={{ href, children: "" }} className="result-card-v2">
        <HeaderSectionContainer>
          <CardTitle>{title}</CardTitle>
        </HeaderSectionContainer>
        <BodySectionContainer className="mt-8">
          <CardDescription className="flex flex-col gap-24">{description}</CardDescription>
        </BodySectionContainer>
      </CardGeneralV2>
    </Link>
  );
}

/** A line of text inside a ResultCard description, with the card's default typography. */
export function ResultCardText({ className, children }: ResultCardTextProps) {
  return (
    <Typograph tag="p" className={twMerge("text-m-regular text-neutral-900", className)}>
      {children}
    </Typograph>
  );
}

export function buildProjectResult({
  item,
  indicator,
  pathname,
  t,
  locale,
  financedLabel,
  paidLabel,
}: ProjectResultOptions) {
  const title = String(item.operationName ?? "");
  const operationCode = String(item.operationCode ?? "");
  const conclusionDate = item.effectiveConclusionDate ?? item.plannedConclusionDate ?? "";
  const conclusionLabel = item.effectiveConclusionDate ? "conclusionDate" : "plannedConclusionDate";
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

  const description = (
    <>
      <div className="flex flex-col">
        <ResultCardText className="first-letter:uppercase">
          <strong>{t("operationCode")}</strong> {operationCode}
        </ResultCardText>
        <ResultCardText className="first-letter:uppercase">
          <strong>{t(`searchBenProj.fields.${conclusionLabel}`)}</strong>{" "}
          {formatDateLong(String(conclusionDate), locale)}
        </ResultCardText>
      </div>
      <ResultCardText className="first-letter:uppercase">
        <strong>{t(valueLabel)}</strong> {formatCurrency(Number(item[valueKey] ?? 0), t)}
      </ResultCardText>
    </>
  );

  return {
    title,
    description,
    href: `${pathname}/${encodeURIComponent(operationCode)}`,
  };
}
