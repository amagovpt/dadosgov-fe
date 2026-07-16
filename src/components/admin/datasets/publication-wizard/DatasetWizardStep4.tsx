"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button, CardGeneral, Icon, ProgressBar, StatusCard } from "@ama-pt/agora-design-system";
import PublicationFeedbackButton from "@/components/admin/PublicationFeedbackButton";
import type { Dataset } from "@/service/types/dataset";
import { formatDateToTimeAgo } from "@/utils/formatDate";
import type { AdminCard } from "@/service/types/admin/common";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

export interface DatasetWizardStep4Props {
  publishStepCard?: AdminCard;
  createdDataset: Dataset | null;
  datasetTitle: string;
  datasetDescription: string;
  onPublish: () => void;
  onSaveDraft: () => void;
  isSubmitting: boolean;
}

export function DatasetWizardStep4(props: DatasetWizardStep4Props) {
  const { t } = useTranslation("admin-datasets");
  const {
    publishStepCard,
    createdDataset,
    datasetTitle,
    datasetDescription,
    onPublish,
    onSaveDraft,
    isSubmitting,
  } =
    props;

  const qualityScore =
    createdDataset?.quality?.score != null ? Math.round(createdDataset.quality.score * 100) : 0;
  const formatMetric = (value: number | undefined) => {
    if (!value) return "0";
    if (value >= 1_000_000) return (value / 1_000_000).toFixed(1).replace(".", ",") + " M";
    if (value >= 1_000) return (value / 1_000).toFixed(0) + " mil";
    return String(value);
  };
  const timeAgo = formatDateToTimeAgo(createdDataset?.last_modified, "agora");
  const href = createdDataset
    ? `/datasets/${createdDataset.slug}`
    : `/datasets/preview?title=${encodeURIComponent(datasetTitle)}&description=${encodeURIComponent(datasetDescription)}`;

  return (
    <>
      {publishStepCard ? (
        <StatusCard
          variant="success"
          showIcon
          description={
            <>
              <strong>{publishStepCard.title}</strong>
              <br />
              {formatHtmlParagraphs(publishStepCard.description)}
            </>
          }
        />
      ) : null}

      <Link href={href} className="card-general-listing flex flex-col overflow-hidden rounded-4">
        <CardGeneral
          variant="neutral-100"
          image={{
            src: createdDataset?.organization?.logo || "/images/placeholders/organization.png",
            alt: createdDataset?.organization?.name || t("form.organizationFallback"),
            height: "56px",
            className: "bg-primary-100 !object-contain !h-[56px]",
          }}
          subtitleText={
            (
              <div className="flex flex-col">
                <span style={{ fontSize: "16px" }} className="text-neutral-900">
                  {timeAgo}
                </span>
                <span
                  style={{ fontSize: "16px", fontWeight: 300 }}
                  className="mt-4 text-neutral-900"
                >
                  {createdDataset?.organization?.name || t("form.withoutOrganization")}
                </span>
              </div>
            ) as unknown as string
          }
          titleText={createdDataset?.title || datasetTitle || t("form.untitledFallback")}
          descriptionText={
            (
              <div className="flex grow flex-col">
                <p className="mb-16 line-clamp-3 text-m-regular text-neutral-800">
                  {createdDataset?.description ||
                    datasetDescription ||
                    t("form.withoutDescription")}
                </p>
                <div
                  className={`mt-auto ${qualityScore <= 45 ? "quality-progress-warning" : qualityScore > 50 ? "quality-progress-success" : ""}`}
                >
                  <ProgressBar
                    value={qualityScore}
                    max={100}
                    hideLabel={true}
                    hidePercentageValue={true}
                  />
                  <span className="mt-4 block text-s-regular text-neutral-900">
                    {qualityScore}% {t("form.metadataQuality")}
                  </span>
                  <div className="text-xs mt-12 flex flex-wrap items-center gap-8 text-neutral-700">
                    <div className="flex items-center gap-8" title={t("form.metricViews")}>
                      <Icon
                        name={createdDataset?.metrics?.views ? "agora-solid-eye" : "agora-line-eye"}
                        dimensions="xs"
                        className="fill-neutral-700"
                        aria-hidden="true"
                      />
                      <span>{formatMetric(createdDataset?.metrics?.views)}</span>
                    </div>
                    <div className="flex items-center gap-8" title={t("form.metricDownloads")}>
                      <Icon
                        name={
                          createdDataset?.metrics?.resources_downloads
                            ? "agora-solid-download"
                            : "agora-line-download"
                        }
                        dimensions="xs"
                        className="fill-neutral-700"
                        aria-hidden="true"
                      />
                      <span>{formatMetric(createdDataset?.metrics?.resources_downloads)}</span>
                    </div>
                    <div className="flex items-center gap-8" title={t("form.metricReuses")}>
                      <img
                        src="/Icons/bar_chart.svg"
                        className="h-16 w-16"
                        alt=""
                        aria-hidden="true"
                      />
                      <span>{createdDataset?.metrics?.reuses || 0}</span>
                    </div>
                    <div className="flex items-center gap-8" title={t("form.metricFavorites")}>
                      <Icon
                        name={
                          createdDataset?.metrics?.followers
                            ? "agora-solid-star"
                            : "agora-line-star"
                        }
                        dimensions="xs"
                        className="fill-neutral-700"
                        aria-hidden="true"
                      />
                      <span>{formatMetric(createdDataset?.metrics?.followers)}</span>
                    </div>
                  </div>
                  <div className="mt-16 flex items-center gap-8 text-primary-600">
                    <Icon
                      name="agora-line-arrow-right-circle"
                      className="h-32 w-32"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </div>
            ) as unknown as string
          }
          isBlockedLink={true}
          anchor={{ href }}
        />
      </Link>

      <PublicationFeedbackButton />

      <div className="admin-page__actions flex justify-end gap-[18px]">
        <Button appearance="outline" variant="neutral" onClick={onSaveDraft} disabled={isSubmitting}>
          {isSubmitting ? t("form.savingDraft") : t("form.saveDraftAction")}
        </Button>
        <Button variant="primary" onClick={onPublish} disabled={isSubmitting}>
          {isSubmitting ? t("form.publishingDataset") : t("form.publishDatasetAction")}
        </Button>
      </div>
    </>
  );
}
