import { InfoBlock } from "../InfoBlock";
import Section from "../Section";
import { DatastorySection as DatastorySectionType } from "@/types/datastories/datastory";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

export default function DatastorySection({ id, title, description, iframe }: DatastorySectionType) {
  return (
    <Section id={id} className={"flex flex-col items-center justify-center gap-64 bg-white"}>
      <InfoBlock.Root className={"gap-64 pt-64"}>
        <InfoBlock.Header className="gap-16">
          <InfoBlock.Title
            titleLevel="h2"
            title={title}
            className="text-2xl font-bold text-primary-900"
          />
          <InfoBlock.Description
            className="max-w-[500px] whitespace-pre-wrap text-m-light text-black"
            description={formatHtmlParagraphs(description) as string[]}
          />
        </InfoBlock.Header>
      </InfoBlock.Root>
      <div className="flex w-full flex-col items-center justify-center gap-128 bg-primary-100 pt-32">
        <div className="container -mb-[54px]">
          {iframe.map((iframe, index) => {
            return (
              <InfoBlock.IFrame
                key={`iframe-${id}-${index}`}
                src={iframe.source}
                className={iframe.classNames}
              />
            );
          })}
        </div>
      </div>
    </Section>
  );
}
