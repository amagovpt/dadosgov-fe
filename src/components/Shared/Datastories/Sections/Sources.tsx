"use client";

import Section from "../../Section";
import { InfoBlock } from "../../InfoBlock";
import { twJoin, twMerge } from "tailwind-merge";
import { useTranslation } from "react-i18next";
import { SourceDataset, SourceSection } from "@/service/types/datastories/datastory";
import { formatDateToDMY, formatDateToTimeAgo } from "@/utils/formatDate";
import CardMetrics, { CardMetricsProps } from "@/components/Primitives/Cards/CardMetrics";
import { DatasetBadges } from "@/components/datasets/DatasetBadges";
import { LoadMoreWrapper } from "@/components/Shared/Wrappers/LoadMoreWrapper";

export type SourcesI = SourceSection & {
  className?: string;
  /** When set, shows this many datasets at first and reveals the rest with "Ver mais". */
  pageSize?: number;
  /**
   * The datasets come from the API with their metrics and quality, so they are shown with the
   * same cards and grid as the /datasets listing. Squidex datasets carry none of that.
   */
  fromCatalog?: boolean;
};

function cardProps(dataset: SourceDataset, lastModified: string) {
  return {
    ...dataset,
    last_modified: lastModified,
    link: `/datasets/${dataset.slug}`,
    organization: {
      name: dataset.organizationName,
      logo: dataset.image?.[0] || "",
    },
  } as CardMetricsProps;
}

function renderDataset(dataset: SourceDataset) {
  return (
    <div key={`dataset-${dataset.slug}`} className="col-span-12 sm:col-span-6 lg:col-span-4">
      <CardMetrics {...cardProps(dataset, formatDateToDMY(dataset.createdAt))} />
    </div>
  );
}

export default function Sources({
  id,
  className,
  title,
  datasets,
  pageSize,
  fromCatalog,
}: SourcesI) {
  const { i18n } = useTranslation();
  const { language } = i18n;

  // Mirrors the cards of DatasetsClient
  const renderCatalogDataset = (dataset: SourceDataset) => (
    <CardMetrics
      key={`dataset-${dataset.slug}`}
      {...cardProps(dataset, formatDateToTimeAgo(dataset.createdAt, language as "pt" | "en"))}
      titleBadges={<DatasetBadges badges={dataset.badges} />}
    />
  );

  return (
    <Section
      id={id}
      className={twMerge(
        twJoin(
          "datastory-datasets relative flex items-center justify-center overflow-hidden py-64",
          !fromCatalog && "datastory-datasets-static"
        ),
        className
      )}
    >
      <InfoBlock.Root className="flex-col gap-32">
        <InfoBlock.Header className="w-full gap-16 lg:w-1/2">
          <InfoBlock.Title
            titleLevel="h2"
            title={title}
            className="text-xl-bold text-primary-900"
          />
        </InfoBlock.Header>
        {pageSize ? (
          // The full list is already here, so each page is a slice of it, not a request
          <LoadMoreWrapper
            initialItems={datasets.slice(0, pageSize)}
            totalItems={datasets.length}
            onLoadMore={async (page) => ({
              data: datasets.slice((page - 1) * pageSize, page * pageSize),
            })}
            renderItem={fromCatalog ? renderCatalogDataset : renderDataset}
            className={
              fromCatalog
                ? "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
                : "grid-cols-12 xs:grid-cols-12 xl:grid-cols-12"
            }
          />
        ) : (
          <div
            className={twJoin(
              "grid w-full gap-32",
              fromCatalog ? "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3" : "grid-cols-12"
            )}
          >
            {datasets?.map(fromCatalog ? renderCatalogDataset : renderDataset)}
          </div>
        )}
      </InfoBlock.Root>
    </Section>
  );
}
