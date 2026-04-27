"use client";

import Section from "../Section";
import { InfoBlock } from "../InfoBlock";
import { twMerge } from "tailwind-merge";
import { CardCompound } from "../CardCompound";
import { CardMetricsProps } from "../CardCompound/CardMetrics";

export type DataSourcesSectionProps = {
  className?: string;
  title: string;
  title_pl: string;
  dataSources: {
    [key: string]: { [key: string]: string | number } | string | number;
  }[];
};

export default function DataSourcesSection({
  className,
  title,
  title_pl,
  dataSources,
}: DataSourcesSectionProps) {
  const pluralTitle = dataSources.length === 1 ? title : title_pl;

  return (
    <Section
      className={twMerge("flex items-center justify-center pt-64 pb-128 overflow-hidden", className)}
    >
      <div className="z-10 container">
        <InfoBlock.Root>
          <InfoBlock.Content className="w-full gap-64 flex flex-row">
            <div className="flex flex-col gap-32">
              <InfoBlock.Header className="gap-[8px]">
                <InfoBlock.Title
                  titleLevel="h2"
                  title={`${dataSources.length} ${pluralTitle}`}
                  className="text-2xl font-bold text-primary-900"
                />
              </InfoBlock.Header>
              <InfoBlock.Content className="w-full flex">
                <div className="w-full grid grid-cols-1 xl:grid-cols-3 gap-32">
                  {dataSources.map((source, index) => {
                    return <CardCompound.Metrics key={index} {...(source as CardMetricsProps)} />;
                  })}
                </div>
              </InfoBlock.Content>
            </div>
          </InfoBlock.Content>
        </InfoBlock.Root>
      </div>
    </Section>
  );
}
