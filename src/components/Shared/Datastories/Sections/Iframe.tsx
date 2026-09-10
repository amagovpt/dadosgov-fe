import { twMerge } from "tailwind-merge";
import { InfoBlock } from "../../InfoBlock";
import Section from "../../Section";
import { IframeSection } from "@/service/types/datastories/datastory";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import { LinkWrapper } from "@ama-pt/agora-design-system";
import Link from "next/link";
import Icon from "@/components/Primitives/Icon";

export type IframeI = Omit<IframeSection, "schemaName"> & { className?: string };

export default function Iframe({ id, title, description, links, iframe, className }: IframeI) {
  return (
    <Section
      id={id}
      className={twMerge(
        "flex flex-col items-center justify-center gap-32 bg-primary-100 lg:gap-64",
        className
      )}
    >
      {(title || description) && (
        <InfoBlock.Root className={"gap-64 pt-64"}>
          <InfoBlock.Header className="w-full gap-16 lg:w-1/2">
            <InfoBlock.Title
              titleLevel="h2"
              title={title}
              className="text-2xl font-bold text-primary-900"
            />
            <InfoBlock.Description
              className="text-m-light whitespace-pre-wrap text-black"
              description={formatHtmlParagraphs(description) as string[]}
            />
            {links.map((link) => {
              return (
                <LinkWrapper
                  key={link.children}
                  appearance="link"
                  className="flex w-fit items-center gap-8"
                >
                  <Link href={link.href}>{link.children}</Link>
                  <Icon name={link.icon ?? "agora-line-external-link"} />
                </LinkWrapper>
              );
            })}
          </InfoBlock.Header>
        </InfoBlock.Root>
      )}
      {iframe.map((iframe, index) => {
        return (
          <div
            className={twMerge(
              "relative flex w-full flex-col items-center justify-center gap-128",
              iframe.classNameIframeBackground ? "bg-white" : null
            )}
            key={`iframe-${id}-${index}`}
          >
            {iframe.classNameIframeBackground && (
              <div
                className={twMerge(
                  "absolute top-0 left-0 w-full bg-primary-100",
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
