"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button, CardLinks, Icon } from "@ama-pt/agora-design-system";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import type { Dataset } from "@/service/types/dataset";
import { formatMetricValue } from "@/utils/formatNumber";

interface SelectedDatasetCardProps {
  dataset: Dataset;
  canRemove: boolean;
  onRemove: () => void;
}

export default function SelectedDatasetCard({
  dataset,
  canRemove,
  onRemove,
}: SelectedDatasetCardProps) {
  const { t } = useTranslation("admin-community-resources");

  return (
    <div className="agora-card-links-datasets-px0 mt-16">
      <CardLinks
        onClick={() => {}}
        className="cursor-pointer text-neutral-900"
        variant="transparent"
        image={{
          src: dataset.organization?.logo || "/images/placeholders/organization.png",
          alt: dataset.organization?.name || t("form.noOrganizationLogo"),
        }}
        category={dataset.organization?.name}
        title={dataset.title}
        description={
          <div className="flex flex-col gap-12">
            <p className="text-sm mt-8 line-clamp-3 max-w-[592px] leading-relaxed text-neutral-900">
              {dataset.description}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-8">
              <span className="text-sm font-medium text-neutral-900">
                {t("form.metadataScore")}:{" "}
                {dataset.quality?.score != null ? Math.round(dataset.quality.score * 100) : 0}%
              </span>
            </div>
            <div className="text-xs mb-32 mt-32 flex flex-wrap items-center gap-32 text-[#034AD8]">
              <div className="flex items-center gap-8" title={t("form.views")}>
                <Icon name="agora-line-eye" className="" aria-hidden="true" />
                <span>{formatMetricValue(dataset.metrics?.views)}</span>
              </div>
              <div className="flex items-center gap-8" title={t("form.downloads")}>
                <Icon name="agora-line-download" className="" aria-hidden="true" />
                <span>{formatMetricValue(dataset.metrics?.resources_downloads, 0)}</span>
              </div>
              <div className="flex items-center gap-8" title={t("form.reuses")}>
                <img src="/Icons/bar_chart.svg" className="" alt="" aria-hidden="true" />
                <span>{dataset.metrics?.reuses || 0}</span>
              </div>
              <div className="flex items-center gap-8" title={t("form.favorites")}>
                <img src="/Icons/favorite.svg" className="" alt="" aria-hidden="true" />
                <span>{formatMetricValue(dataset.metrics?.followers, 0)}</span>
              </div>
            </div>
          </div>
        }
        date={
          <span className="font-[300]">
            {t("form.updatedAgo", {
              time: formatDistanceToNow(new Date(dataset.last_modified), { locale: pt })
                .replace("aproximadamente ", "")
                .replace("quase ", "")
                .replace("menos de ", "")
                .replace("cerca de ", ""),
            })}
          </span>
        }
        mainLink={
          <Link href={`/datasets/${dataset.slug}`}>
            <span className="underline">{dataset.title}</span>
          </Link>
        }
        blockedLink={true}
      />
      {canRemove && (
        <div className="mt-8 flex justify-end">
          <Button
            appearance="solid"
            variant="danger"
            hasIcon
            leadingIcon="agora-line-trash"
            leadingIconHover="agora-solid-trash"
            onClick={onRemove}
          >
            {t("form.remove")}
          </Button>
        </div>
      )}
    </div>
  );
}
