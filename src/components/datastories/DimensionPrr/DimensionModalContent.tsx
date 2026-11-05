"use client";
import { Anchor, Button, Icon, useModalContext } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";
import { Typograph } from "@/components/Shared/Generics/Typograph";
import { localizeHref } from "@/utils/localizeHref";
import type { DimensionDetailItem } from "@/lib/prr/dimensions";
import DimensionMilestoneItem from "./DimensionMilestoneItem";
import DimensionFundingChart from "./DimensionFundingChart";

export type DimensionDetailType = "investments" | "reforms";

type DimensionModalContentProps = {
  item: DimensionDetailItem;
  type: DimensionDetailType;
};

const BENEFICIARIES_HREF = "/datastories/prr/beneficiarios-do-prr";
const PROJECTS_HREF = "/datastories/prr/projetos-do-prr";

export default function DimensionModalContent({ item, type }: DimensionModalContentProps) {
  const { hide } = useModalContext();
  const { t, i18n } = useTranslation("common");
  const { title, description, expectedCompletionDate, milestones, funding } = item;

  const isInvestment = type === "investments";
  const isComplete = milestones.length > 0 && milestones.every((milestone) => milestone.isComplete);
  // Investments are wider: the funding chart sits next to the milestones on large screens
  const blockClassName = isInvestment
    ? "flex flex-col self-center w-full md:w-[600px]"
    : "flex flex-col";
  const fundingChart = isInvestment && funding && <DimensionFundingChart {...funding} />;

  const milestoneItems = milestones.map((milestone, index) => (
    <DimensionMilestoneItem key={index} {...milestone} isLast={index === milestones.length - 1} />
  ));

  const backButton = (
    <Button
      appearance="solid"
      variant="neutral"
      hasIcon
      trailingIcon="agora-line-arrow-right-circle"
      trailingIconHover="agora-solid-arrow-right-circle"
      darkMode
      onClick={hide}
    >
      {t("prr.dimensions.backToChart")}
    </Button>
  );

  return (
    <div
      className={`mx-auto flex flex-col gap-32 px-16 pb-32 text-white md:px-24 ${
        isInvestment ? "max-w-[1200px]" : "max-w-[600px]"
      }`}
    >
      <div className={blockClassName}>
        <Icon name="agora-line-coins" dimensions="xxl" aria-hidden className="fill-primary-100!" />
        <div className="flex flex-col gap-24">
          <Typograph tag="h2" className="text-xl-light">
            {isInvestment ? t("prr.dimensions.investment") : t("prr.dimensions.reform")}{" "}
            <strong>{title}</strong>
          </Typograph>
          {isInvestment && description && (
            <Typograph tag="p" className="text-m-regular">
              {description}
            </Typograph>
          )}
        </div>
      </div>
      <hr aria-hidden className="w-full border-t border-neutral-700" />
      {expectedCompletionDate && (
        <div className={`${blockClassName} gap-8`}>
          <Typograph tag="p" className="text-m-bold">
            {isComplete
              ? t("prr.dimensions.conclusionDate")
              : t("prr.dimensions.expectedCompletionDate")}
          </Typograph>
          <Typograph tag="p" className="text-m-regular">
            {`${t(isComplete ? "prr.dimensions.completedIn" : "prr.dimensions.until")} `}
            <span className="inline-block first-letter:uppercase">{expectedCompletionDate}</span>
          </Typograph>
        </div>
      )}
      {milestones.length > 0 && (
        <>
          <hr aria-hidden className="w-full border-t border-neutral-700" />
          {/* Below xl the funding chart goes on top; from xl it sits on the right */}
          <div className="flex flex-col gap-64 xl:hidden">
            {fundingChart && <div className="w-full overflow-hidden">{fundingChart}</div>}
            <div className="flex min-w-0 flex-col gap-64 md:gap-0">{milestoneItems}</div>
          </div>
          <div className="my-32 hidden flex-row flex-nowrap gap-64 xl:flex">
            <div className="flex min-w-0 flex-1 flex-col">{milestoneItems}</div>
            {fundingChart && (
              <div className="w-[350px] shrink-0 overflow-hidden">{fundingChart}</div>
            )}
          </div>
        </>
      )}
      <hr aria-hidden className="w-full border-t border-neutral-700" />
      {isInvestment ? (
        <div className="mt-32 flex w-full max-w-[1000px] flex-col gap-64 self-center">
          <div className="flex flex-wrap gap-48">
            <Anchor
              href={localizeHref(BENEFICIARIES_HREF, i18n.language)}
              variant="neutral"
              darkMode
              hasIcon
              trailingIcon="agora-line-arrow-right-circle"
              trailingIconHover="agora-solid-arrow-right-circle"
            >
              {t("prr.dimensions.consultBeneficiaries")}
            </Anchor>
            <Anchor
              href={localizeHref(PROJECTS_HREF, i18n.language)}
              variant="neutral"
              darkMode
              hasIcon
              trailingIcon="agora-line-arrow-right-circle"
              trailingIconHover="agora-solid-arrow-right-circle"
            >
              {t("prr.dimensions.consultProjects")}
            </Anchor>
          </div>
          <hr aria-hidden className="border-t border-neutral-700" />
          <div>{backButton}</div>
        </div>
      ) : (
        <div className="mt-32">{backButton}</div>
      )}
    </div>
  );
}
