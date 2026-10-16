"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import {
  Button,
  CardGeneral,
  CardGeneralV2,
  HeaderSectionContainer,
  BodySectionContainer,
  CardSubtitle,
  CardTitle,
  CardStatus,
  CardDescription,
  Pill,
  Icon,
  ProgressBar,
  StatusCard,
} from "@ama-pt/agora-design-system";
import PublicationFeedbackButton from "@/components/admin/PublicationFeedbackButton";
import type { Dataset } from "@/service/types/dataset";
import { formatDateToTimeAgo } from "@/utils/formatDate";
import type { AdminCard } from "@/service/types/admin/common";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

export interface DatasetWizardStep4Props {
  redesigned?: boolean;
  publishStepCard?: AdminCard;
  createdDataset: Dataset | null;
  datasetTitle: string;
  datasetDescription: string;
  onPublish: () => void;
  onSaveDraft: () => void;
  isSubmitting: boolean;
}

export function DatasetWizardStep4(props: DatasetWizardStep4Props) {
  const { t, i18n } = useTranslation("admin-datasets");
  const {
    publishStepCard,
    createdDataset,
    datasetTitle,
    datasetDescription,
    onPublish,
    onSaveDraft,
    isSubmitting,
  } = props;

  const qualityScore =
    createdDataset?.quality?.score != null ? Math.round(createdDataset.quality.score * 100) : 0;
  const formatMetric = (value: number | undefined) => {
    if (!value) return "0";
    if (value >= 1_000_000) return (value / 1_000_000).toFixed(1).replace(".", ",") + " M";
    if (value >= 1_000) return (value / 1_000).toFixed(0) + " mil";
    return String(value);
  };
  const timeAgo = formatDateToTimeAgo(createdDataset?.last_modified || createdDataset?.created_at);
  const href = createdDataset
    ? `/datasets/${createdDataset.slug}`
    : `/datasets/preview?title=${encodeURIComponent(datasetTitle)}&description=${encodeURIComponent(datasetDescription)}`;

  if (props.redesigned) {
    const producer = createdDataset?.organization;
    const owner = createdDataset?.owner;
    const producerName =
      producer?.name ||
      [owner?.first_name, owner?.last_name].filter(Boolean).join(" ") ||
      t("form.withoutOrganization");
    const producerLogo = producer?.logo || owner?.avatar_thumbnail || owner?.avatar;
    const date = createdDataset?.created_at ? new Date(createdDataset.created_at) : null;
    const formattedDate =
      date && !Number.isNaN(date.getTime())
        ? date
            .toLocaleDateString(i18n.language, {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
            .replaceAll("/", ".")
        : null;
    const disabled = isSubmitting || !createdDataset;
    return (
      <div className="flex w-full min-w-0 flex-col gap-64" aria-busy={isSubmitting}>
        {createdDataset && (
          <StatusCard
            variant="success"
            showIcon
            title={t("review.successTitle")}
            description={
              <span className="block max-w-[592px]">{t("review.successDescription")}</span>
            }
            className="w-full rounded-4 p-16! [&_.status-card-content]:gap-8"
          />
        )}
        <div className="flex w-[800px] max-w-full flex-col gap-64">
          <CardGeneralV2
            variant="primary-100"
            className="border-0! p-0! [&_.agora-card-general-content]:gap-8! [&_.agora-card-general-main]:rounded-none! [&_.agora-card-general-main]:p-32!"
            aria-label={t("review.previewLabel")}
          >
            <HeaderSectionContainer className="[&_.agora-card-general-header-details]:gap-8!">
              <CardSubtitle className="flex flex-col items-start gap-16">
                {producerLogo && (
                  <Image
                    unoptimized
                    src={producerLogo}
                    alt={producerName}
                    width={129}
                    height={49}
                    className="h-[49px] max-w-[129px] object-contain object-left"
                  />
                )}
                <span className="max-w-[296px] text-m-regular text-neutral-900">
                  {producerName}
                </span>
                {formattedDate && (
                  <Pill variant="primary" className="h-32! rounded-[999px]! px-16! text-s-regular">
                    {formattedDate}
                  </Pill>
                )}
              </CardSubtitle>
              <CardTitle as="h2" className="text-l-bold! text-neutral-900!">
                {createdDataset?.title || datasetTitle || t("form.untitledFallback")}
              </CardTitle>
            </HeaderSectionContainer>
            <BodySectionContainer className="gap-8!">
              <CardStatus className="w-full [&_.agora-card-general-status-icon]:hidden [&_.agora-card-general-status-text]:w-full">
                <ProgressBar
                  current
                  value={qualityScore}
                  max={100}
                  label={t("form.metadataQuality")}
                  appearance="regular"
                  className="w-full [&_.progress-bar]:my-16! [&_.progress-bar]:mb-4! [&_.progress-bar]:h-12!"
                />
              </CardStatus>
              <CardDescription className="text-m-regular! text-neutral-900!">
                <span className="block whitespace-pre-line">
                  {createdDataset?.description ||
                    datasetDescription ||
                    t("form.withoutDescription")}
                </span>
                <span className="mt-8 flex flex-wrap items-center gap-8 text-s-regular text-neutral-700">
                  <span className="inline-flex items-center gap-8">
                    <Icon name="agora-line-eye" dimensions="xs" aria-hidden="true" />
                    <span>{t("review.views", { count: createdDataset?.metrics?.views || 0 })}</span>
                  </span>
                  <span className="inline-flex items-center gap-8">
                    <Icon name="agora-line-download" dimensions="xs" aria-hidden="true" />
                    <span>
                      {t("review.downloads", {
                        count: createdDataset?.metrics?.resources_downloads || 0,
                      })}
                    </span>
                  </span>
                </span>
              </CardDescription>
            </BodySectionContainer>
          </CardGeneralV2>
          <div className="flex flex-wrap items-center justify-end gap-32">
            <Button
              appearance="link"
              variant="primary"
              hasIcon
              leadingIcon="agora-line-download"
              leadingIconHover="agora-solid-download"
              onClick={onSaveDraft}
              disabled={disabled}
            >
              {isSubmitting ? t("form.savingDraft") : t("form.saveCreationDraft")}
            </Button>
            <Button
              variant="primary"
              hasIcon
              leadingIcon="agora-line-check-circle"
              leadingIconHover="agora-solid-check-circle"
              onClick={onPublish}
              disabled={disabled}
            >
              {isSubmitting ? t("form.publishingDataset") : t("review.publishAction")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

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

      <div data-dataset-actions className="admin-page__actions flex justify-end gap-[18px]">
        <Button
          appearance="outline"
          variant="neutral"
          onClick={onSaveDraft}
          disabled={isSubmitting}
        >
          {isSubmitting ? t("form.savingDraft") : t("form.saveDraftAction")}
        </Button>
        <Button variant="primary" onClick={onPublish} disabled={isSubmitting}>
          {isSubmitting ? t("form.publishingDataset") : t("form.publishDatasetAction")}
        </Button>
      </div>
    </>
  );
}
