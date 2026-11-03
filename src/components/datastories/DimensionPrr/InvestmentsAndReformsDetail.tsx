"use client";
import { useId, useState } from "react";
import { Anchor, ProgressBar } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Shared/Modal";
import { SeeMoreToggle } from "@/components/Shared/SeeMoreToggle";
import { SourceInfoFooter, SourceInfoFooterProps } from "@/components/Shared/SourceInfoFooter";
import { Typograph } from "@/components/Shared/Generics/Typograph";
import { formatNumber } from "@/utils/formatNumber";
import type { DimensionDetailCategory, DimensionDetailItem } from "@/lib/prr/dimensions";
import DimensionModalContent, { DimensionDetailType } from "./DimensionModalContent";

export interface InvestmentsAndReformsDetailProps {
  categories: DimensionDetailCategory[];
  type: DimensionDetailType;
  sourceInfo?: SourceInfoFooterProps;
  className?: string;
}

const formatPercentage = (value: number) => `${formatNumber(value, { fractionDigits: 2 })}%`;

function ItemCard({ item, type }: { item: DimensionDetailItem; type: DimensionDetailType }) {
  const { t } = useTranslation("common");
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Modal.Trigger
      className="w-full max-w-[800px] cursor-pointer"
      content={<DimensionModalContent item={item} type={type} />}
    >
      <div
        className="flex flex-col items-start justify-between gap-16 bg-neutral-100 p-32 transition-colors hover:bg-neutral-200 md:flex-row md:items-center"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-8">
          <Typograph tag="p" className="text-l-bold text-neutral-900">
            {item.title}
          </Typograph>
          <div className="flex flex-col">
            <Typograph tag="span" className="text-m-regular text-neutral-900">
              {t("prr.dimensions.completionPercentage")}
            </Typograph>
            <Typograph tag="span" className="text-m-bold text-neutral-900">
              {formatPercentage(item.completionPercentage)}
            </Typograph>
          </div>
        </div>
        <span className="self-end md:self-center [&>a]:pointer-events-none" aria-hidden>
          <Anchor
            variant="primary"
            hasIcon
            iconOnly
            tabIndex={-1}
            trailingIcon={
              isHovered ? "agora-solid-arrow-right-circle" : "agora-line-arrow-right-circle"
            }
          />
        </span>
      </div>
    </Modal.Trigger>
  );
}

export function InvestmentsAndReformsDetail({
  categories,
  type,
  sourceInfo,
  className = "",
}: InvestmentsAndReformsDetailProps) {
  const { t } = useTranslation("common");
  const autoId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const itemCountLabel = t(
    type === "investments" ? "prr.dimensions.investments" : "prr.dimensions.reforms"
  );

  return (
    <div className={`w-full ${className}`}>
      <Modal.Root>
        <div className="divide-y divide-neutral-300 border-y border-neutral-300">
          {categories.map((category, index) => {
            const isOpen = openIndex === index;
            const detailsId = `details-${autoId}-${index}`;
            const percentage = Math.min(100, Math.max(0, category.completionPercentage));

            return (
              <div key={category.title} className="flex flex-col gap-16 py-32">
                <Typograph tag="h3" className="text-l-bold text-neutral-900">
                  {category.title}
                </Typograph>
                <div className="flex flex-col items-start gap-16 md:flex-row md:gap-32">
                  <Typograph
                    tag="span"
                    className="w-full text-m-regular text-neutral-900 md:max-w-[248px]"
                  >
                    {category.itemCount} {itemCountLabel}
                  </Typograph>
                  <div className="flex w-full flex-col gap-8 md:max-w-[416px]">
                    <ProgressBar
                      value={percentage}
                      max={100}
                      hideLabel
                      hidePercentageValue
                      appearance="regular"
                      aria-hidden
                      className="dimension-progress w-full [&_.progress-bar]:h-24!"
                    />
                    <div className="flex items-center justify-between">
                      <Typograph tag="span" className="text-s-regular text-neutral-900">
                        {t("prr.dimensions.completionPercentage")}
                      </Typograph>
                      <Typograph tag="span" className="text-m-bold text-neutral-900">
                        {formatPercentage(category.completionPercentage)}
                      </Typograph>
                    </div>
                  </div>
                </div>
                {category.items.length > 0 && (
                  <>
                    <SeeMoreToggle
                      isExpanded={isOpen}
                      onToggle={() => setOpenIndex(isOpen ? null : index)}
                      ariaControls={detailsId}
                      moreLabel={t("prr.dimensions.seeMore")}
                      lessLabel={t("prr.dimensions.seeLess")}
                      className="flex w-fit items-center gap-8 pt-8 text-s-regular text-primary-600"
                      iconClassName="h-24 w-24 text-neutral-900"
                    />
                    {isOpen && (
                      <div
                        id={detailsId}
                        className="ml-16 flex flex-col gap-32 border-l-2 border-neutral-300 pl-16"
                      >
                        {category.items.map((item) => (
                          <ItemCard key={item.title} item={item} type={type} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Modal.Root>
      {sourceInfo && <SourceInfoFooter {...sourceInfo} className="pt-32" />}
    </div>
  );
}
