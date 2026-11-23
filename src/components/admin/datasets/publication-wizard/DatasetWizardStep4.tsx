"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import {
  Button,
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
import type { Dataset } from "@/service/types/dataset";
import type { AdminCard } from "@/service/types/admin/common";
import {
  getDatasetPublicationIssues,
  type DatasetPublicationMetadata,
} from "@/utils/datasetPublication";
import { DatasetContentDescription } from "../DatasetContentProvider";

export interface DatasetWizardStep4Props {
  publishStepCard?: AdminCard;
  createdDataset: Dataset | null;
  previewDataset?: DatasetPublicationMetadata;
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
  const previewDataset = props.previewDataset ?? createdDataset;
  const publicationIssues = previewDataset ? getDatasetPublicationIssues(previewDataset) : [];
  const publicationBlocked = !previewDataset || publicationIssues.length > 0;
  const publicationFeedback =
    publicationIssues.length > 0 ? (
      <StatusCard
        variant="warning"
        showIcon
        description={t("publication.incomplete", {
          fields: publicationIssues.map((field) => t(`publication.fields.${field}`)).join(", "),
        })}
      />
    ) : null;

  const qualityScore =
    createdDataset?.quality?.score != null ? Math.round(createdDataset.quality.score * 100) : 0;

  const producer = previewDataset?.organization;
  const owner = previewDataset?.owner;
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
  return (
    <div className="flex w-full min-w-0 flex-col gap-64" aria-busy={isSubmitting}>
      {createdDataset && (
        <StatusCard
          variant="success"
          showIcon
          title={publishStepCard?.title ?? ""}
          description={
            <div className="block max-w-[592px]">
              <DatasetContentDescription html={publishStepCard?.description} />
            </div>
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
              <span className="max-w-[296px] text-m-regular text-neutral-900">{producerName}</span>
              {formattedDate && (
                <Pill variant="primary" className="h-32! rounded-[999px]! px-16! text-s-regular">
                  {formattedDate}
                </Pill>
              )}
            </CardSubtitle>
            <CardTitle as="h2" className="text-l-bold! text-neutral-900!">
              {previewDataset?.title || datasetTitle || t("form.untitledFallback")}
            </CardTitle>
          </HeaderSectionContainer>
          <BodySectionContainer className="gap-8!">
            <CardStatus
              hidden={!createdDataset?.quality}
              className="w-full [&_.agora-card-general-status-icon]:hidden [&_.agora-card-general-status-text]:w-full"
            >
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
                {previewDataset?.description || datasetDescription || t("form.withoutDescription")}
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
        {publicationFeedback}
        <div className="flex flex-wrap items-center justify-end gap-32">
          <Button
            appearance="link"
            variant="primary"
            hasIcon
            leadingIcon="agora-line-download"
            leadingIconHover="agora-solid-download"
            onClick={onSaveDraft}
            disabled={isSubmitting}
          >
            {isSubmitting ? t("form.savingDraft") : t("form.saveCreationDraft")}
          </Button>
          <Button
            variant="primary"
            hasIcon
            leadingIcon="agora-line-check-circle"
            leadingIconHover="agora-solid-check-circle"
            onClick={onPublish}
            disabled={isSubmitting || publicationBlocked}
          >
            {isSubmitting ? t("form.publishingDataset") : t("review.publishAction")}
          </Button>
        </div>
      </div>
    </div>
  );
}
