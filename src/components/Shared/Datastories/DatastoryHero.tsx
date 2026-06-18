import Breadcrumb from "../../Primitives/Breadcrumb/Breadcrumb";
import { InfoBlock } from "../InfoBlock";
import Section from "../Section";
import { DatastoryHero as DatastoryHeroType } from "@/service/types/datastories/datastory";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import DatastoryIndex from "./DatastoryIndex";
import { BreadcrumbItem } from "@/service/types/shared/breadcrumbItem";

export type DatastoryHeroI = DatastoryHeroType & {
  breadcrumbs: BreadcrumbItem[];
};

export default function DatastoryHero({ breadcrumbs, title, description, index }: DatastoryHeroI) {
  /** TODO: remove this format when /pages is removed from the app routes */
  const formatedBreadcrumbs: BreadcrumbItem[] = (breadcrumbs || []).map((item, idx) => {
    if (idx === 0) return item;
    if (!item.url) return item;
    if (item.url.startsWith("/pages")) return item;
    const normalized = item.url.startsWith("/") ? item.url : `/${item.url}`;
    return { ...item, url: `/pages${normalized}` };
  });

  return (
    <Section className="flex items-center justify-center bg-primary-900">
      <InfoBlock.Root className="pb-96 pt-64">
        <InfoBlock.Header>
          <Breadcrumb items={formatedBreadcrumbs} darkMode />
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
            <DatastoryIndex {...index} />
          </div>
        </InfoBlock.Content>
      </InfoBlock.Root>
    </Section>
  );
}
