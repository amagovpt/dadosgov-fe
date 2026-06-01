import { twMerge } from "tailwind-merge";
import { InfoBlock } from "../../InfoBlock";
import Section from "../../Section";
import { IframeSection } from "@/types/datastories/datastory";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

export type IframeI = IframeSection & { className?: string };

export default function Iframe({ id, title, description, iframe, className }: IframeI) {
  return (
    <Section
      className={twMerge("flex flex-col items-center justify-center bg-primary-100", className)}
    >
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
      {iframe.map((iframe, index) => {
        return (
          <div
            className="relative flex w-full flex-col items-center justify-center gap-128"
            key={`iframe-${id}-${index}`}
            id={id}
          >
            {iframe.classNameIframeBackground && (
              <div
                className={twMerge(
                  "absolute left-0 top-0 w-full bg-primary-100",
                  iframe.classNameIframeBackground
                )}
              />
            )}
            <div className="container">
              <InfoBlock.IFrame src={iframe.source} className={iframe.classNames} />
            </div>
          </div>
        );
      })}
    </Section>
  );
}
