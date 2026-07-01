"use client";

import Section from "../../Section";
import { InfoBlock } from "../../InfoBlock";
import { Anchor } from "@ama-pt/agora-design-system";
import { twMerge } from "tailwind-merge";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import { SourceSection } from "@/service/types/datastories/datastory";
import { formatDateToTimeAgo } from "@/utils/formatDate";
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
        "relative flex items-center justify-center overflow-hidden py-64",
        className
      )}
    >
      <div className="absolute right-0 top-0 z-0 hidden h-full w-full xl:block">
        <div className="absolute -right-[55px] -top-[71px] h-[373px] w-[373px] rounded-[50px] bg-primary-300" />
        <div className="absolute right-[352px] top-[104px] h-[108px] w-[108px] rounded-[25px] bg-primary-300" />
        <div className="absolute right-[352px] top-[257px] h-[216px] w-[216px] rounded-[50px] bg-primary-300" />
      </div>
      <InfoBlock.Root className="relative z-10 flex-col gap-32">
        <InfoBlock.Header className="w-full gap-16 lg:w-1/2">
          <InfoBlock.Title
            titleLevel="h2"
            title={title}
            className="text-xl-bold text-primary-900"
          />
          <InfoBlock.Content className="flex">
            <InfoBlock.Description
              className="text-m-regular"
              description={formatHtmlParagraphs(description) as string[]}
            />
          </InfoBlock.Content>
        </InfoBlock.Header>
        <InfoBlock.Content>
          <div className="flex flex-col gap-16">
            {datasets?.map((dataset) => {
              const timeAgo = formatDateToTimeAgo(dataset.last_modified);
              const cardProps = {
                ...dataset,
                last_modified: timeAgo,
                link: `/datasets/${dataset.slug}`,
              } as CardMetricsProps;
              return <CardMetrics key={`dataset-${dataset.slug}`} {...cardProps} />;
            })}
          </div>
        </InfoBlock.Content>
      </InfoBlock.Root>
    </Section>
  );
}
