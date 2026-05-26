import { BreadcrumbItem } from "@/types/shared";
import Breadcrumb from "../../Primitives/Breadcrumb/Breadcrumb";
import { InfoBlock } from "../InfoBlock";
import Section from "../Section";
import { DatastoryHero as DatastoryHeroType } from "@/types/datastories/datastory";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import DatastoryIndex from "./DatastoryIndex";

export type DatastoryHeroI = DatastoryHeroType & {
  breadcrumbs: BreadcrumbItem[];
};

export default function DatastoryHero({ breadcrumbs, title, description }: DatastoryHeroI) {
  return (
    <Section className="flex items-center justify-center bg-primary-900">
      <InfoBlock.Root className="pb-96 pt-64">
        <InfoBlock.Header>
          <Breadcrumb items={breadcrumbs} darkMode />
        </InfoBlock.Header>
        <InfoBlock.Content className="flex w-full flex-col justify-between gap-32 lg:flex-row lg:gap-[136px]">
          <div className="flex w-full flex-col gap-32 lg:w-1/2">
            <InfoBlock.Title titleLevel="h1" title={title} className="text-3xl-bold text-white" />
            <InfoBlock.Description
              className="whitespace-pre-wrap text-m-regular text-white"
              classNameContent="flex flex-col gap-32"
              description={formatHtmlParagraphs(description) as string[]}
            />
          </div>
          <div className="flex-1 self-center">
            <DatastoryIndex
              title="Nesta página"
              anchors={[
                { children: "item 1 item 1 item 1 item 1 item 1 item 1 item 1 item 1 item 1 item 1 item 1 item 1 item 1", href: "#1" },
                { children: "item 2", href: "#2" },
                { children: "item 3", href: "#3" },
              ]}
            />
          </div>
        </InfoBlock.Content>
      </InfoBlock.Root>
    </Section>
  );
}
