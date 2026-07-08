"use client";

import Link from "next/link";
import { Button, CardGeneral, Icon, ProgressBar, StatusCard } from "@ama-pt/agora-design-system";
import PublicationFeedbackButton from "@/components/admin/PublicationFeedbackButton";
import type { Dataset } from "@/service/types/dataset";
import { formatDateToTimeAgo } from "@/utils/formatDate";

export interface DatasetWizardStep4Props {
  createdDataset: Dataset | null;
  datasetTitle: string;
  datasetDescription: string;
  onPublish: () => void;
  onSaveDraft: () => void;
  isSubmitting: boolean;
}

export function DatasetWizardStep4(props: DatasetWizardStep4Props) {
  const { createdDataset, datasetTitle, datasetDescription, onPublish, onSaveDraft, isSubmitting } =
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
      <StatusCard
        variant="success"
        showIcon
        description={
          <>
            <strong>O seu conjunto de dados foi criado!</strong>
            <br />
            Agora pode publicar ou guardar como rascunho.
          </>
        }
      />

      <Link href={href} className="card-general-listing flex flex-col overflow-hidden rounded-4">
        <CardGeneral
          variant="neutral-100"
          image={{
            src: createdDataset?.organization?.logo || "/images/placeholders/organization.png",
            alt: createdDataset?.organization?.name || "Organização",
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
                  {createdDataset?.organization?.name || "Sem Organização"}
                </span>
              </div>
            ) as unknown as string
          }
          titleText={createdDataset?.title || datasetTitle || "Sem título"}
          descriptionText={
            (
              <div className="flex grow flex-col">
                <p className="mb-16 line-clamp-3 text-m-regular text-neutral-800">
                  {createdDataset?.description || datasetDescription || "Sem descrição"}
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
                    {qualityScore}% Qualidade dos metadados
                  </span>
                  <div className="text-xs mt-12 flex flex-wrap items-center gap-8 text-neutral-700">
                    <div className="flex items-center gap-8" title="Visualizações">
                      <Icon
                        name={createdDataset?.metrics?.views ? "agora-solid-eye" : "agora-line-eye"}
                        dimensions="xs"
                        className="fill-neutral-700"
                        aria-hidden="true"
                      />
                      <span>{formatMetric(createdDataset?.metrics?.views)}</span>
                    </div>
                    <div className="flex items-center gap-8" title="Downloads">
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
                    <div className="flex items-center gap-8" title="Reutilizações">
                      <img
                        src="/Icons/bar_chart.svg"
                        className="h-16 w-16"
                        alt=""
                        aria-hidden="true"
                      />
                      <span>{createdDataset?.metrics?.reuses || 0}</span>
                    </div>
                    <div className="flex items-center gap-8" title="Favoritos">
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
          Guardar o rascunho
        </Button>
        <Button variant="primary" onClick={onPublish} disabled={isSubmitting}>
          {isSubmitting ? "A publicar..." : "Publicar o conjunto de dados"}
        </Button>
      </div>
    </>
  );
}
