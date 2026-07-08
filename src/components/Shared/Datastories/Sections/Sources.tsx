"use client";

import Section from "../../Section";
import { InfoBlock } from "../../InfoBlock";
import { twMerge } from "tailwind-merge";
import { SourceSection } from "@/service/types/datastories/datastory";
import { formatDateToDMY } from "@/utils/formatDate";
import CardMetrics, { CardMetricsProps } from "@/components/Primitives/Cards/CardMetrics";

export type SourcesI = SourceSection & {
  className?: string;
};

// eslint-disable-next-line max-len
export default function Sources({ id, className, title, datasets }: SourcesI) {
  return (
    <Section
      id={id}
      className={twMerge(
        "datastory-datasets relative flex items-center justify-center overflow-hidden py-64",
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
        <div className="grid w-full grid-cols-12 gap-32">
          {datasets?.map((dataset) => {
            const timeAgo = formatDateToDMY(dataset.createdAt);
            const cardProps = {
              ...dataset,
              last_modified: timeAgo,
              link: `/datasets/${dataset.slug}`,
              organization: {
                name: dataset.organizationName,
                logo: dataset.image?.[0] || "",
              },
            } as CardMetricsProps;
            return (
              <div
                key={`dataset-${dataset.slug}`}
                className="col-span-12 sm:col-span-6 lg:col-span-4"
              >
                <CardMetrics {...cardProps} />
              </div>
            );
          })}
        </div>
      </InfoBlock.Root>
    </Section>
  );
}
