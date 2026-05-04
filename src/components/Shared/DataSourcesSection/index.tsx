"use client";
import Section from "../Section";
import { InfoBlock } from "../InfoBlock";
import { Anchor } from "@ama-pt/agora-design-system";
import { twMerge } from "tailwind-merge";
import { DatastorySource } from "@/types/datastories/datastory";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

export type DataSourcesSectionProps = DatastorySource & {
  className?: string;
};

// eslint-disable-next-line max-len
export default function DataSourcesSection({
  className,
  title,
  description,
  sources,
}: DataSourcesSectionProps) {
  return (
    <Section
      className={twMerge("flex items-center justify-center relative overflow-hidden", className)}
    >
      <div className="z-10 container py-96 overflow-hidden">
        <InfoBlock.Root>
          <InfoBlock.Content className="grid grid-cols-1 xl:grid-sols-2 gap-64 ">
            <div className="w-full flex flex-col gap-32">
              <InfoBlock.Header className="gap-[8px]">
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
                  {sources.map((source, index) => (
                    <Anchor
                      href={source.href}
                      className="!justify-start !text-nowrap"
                      target="_blank"
                      key={index}
                      hasIcon
                      trailingIcon="agora-line-external-link"
                      trailingIconActive="agora-line-external-link"
                      trailingIconHover="agora-solid-external-link"
                    >
                      {source.children}
                    </Anchor>
                  ))}
                </div>
              </InfoBlock.Content>
            </div>
          </InfoBlock.Content>
        </InfoBlock.Root>
      </div>
      <div className="absolute right-0 top-0 w-full h-full -z-10 hidden xl:block">
        <div className="absolute bg-primary-300 w-[373px] h-[373px] rounded-[50px] -top-[71px] -right-[55px]" />
        <div className="absolute bg-primary-300 w-[108px] h-[108px] rounded-[25px] top-[104px] right-[352px]" />
        <div className="absolute bg-primary-300 w-[216px] h-[216px] rounded-[50px] top-[257px] right-[352px]" />
      </div>
    </Section>
  );
}
