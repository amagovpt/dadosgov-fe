import Breadcrumb from "../../Primitives/Breadcrumb/Breadcrumb";
import { InfoBlock } from "../InfoBlock";
import Section from "../Section";
import { DatastoryHero as DatastoryHeroType } from "@/service/types/datastories/datastory";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import DatastoryIndex from "./DatastoryIndex";
import { BreadcrumbItem } from "@/service/types/shared/breadcrumbItem";
import { twJoin } from "tailwind-merge";
import { Typograph } from "../Generics/Typograph";

export type DatastoryHeroI = DatastoryHeroType & {
  breadcrumbs: BreadcrumbItem[];
  className?: string;
};

export default function DatastoryHero({
  breadcrumbs,
  pretitle,
  title,
  description,
  index,
  className,
}: DatastoryHeroI) {
  return (
    <Section className={twJoin("flex items-center justify-center bg-primary-900", className)}>
      <InfoBlock.Root className="pt-64 pb-96">
        <InfoBlock.Header>
          <Breadcrumb items={breadcrumbs} darkMode />
        </InfoBlock.Header>
        <InfoBlock.Content className="flex w-full flex-col justify-between gap-32 lg:flex-row lg:gap-[136px]">
          <div className="info-datastory flex w-full flex-col lg:w-1/2">
            {pretitle && (
              <Typograph tag="p" className="text-m-regular whitespace-pre-wrap text-white mb-8">
                {pretitle}
              </Typograph>
            )}
            <InfoBlock.Title titleLevel="h1" title={title} className="text-3xl-bold text-white" />
            {description && (
              <InfoBlock.Description
                className="text-m-regular whitespace-pre-wrap text-white mt-32"
                classNameContent="flex flex-col gap-32"
                description={formatHtmlParagraphs(description) as string[]}
              />
            )}
          </div>
          <div className="datastory-index flex-1 xl:self-center">
            <DatastoryIndex {...index} />
          </div>
        </InfoBlock.Content>
      </InfoBlock.Root>
    </Section>
  );
}
