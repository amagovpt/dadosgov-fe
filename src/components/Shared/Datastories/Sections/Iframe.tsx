"use client";

import { twMerge } from "tailwind-merge";
import { InfoBlock } from "../../InfoBlock";
import Section from "../../Section";
import { IframeSection } from "@/service/types/datastories/datastory";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import { LinkWrapper } from "@ama-pt/agora-design-system";
import Link from "next/link";
import Icon from "@/components/Primitives/Icon";
import Button from "@/components/Primitives/Button";

export type IframeI = Omit<IframeSection, "schemaName"> & { className?: string };

export default function Iframe({
  id,
  title,
  description,
  links,
  iframe,
  button,
  className,
}: IframeI) {
  return (
    <Section
      id={id}
      className={twMerge(
        "flex flex-col items-center justify-center gap-32 bg-primary-100",
        className
      )}
    >
      {title && description && (
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
            {links &&
              links.map((link) => {
                return (
                  <LinkWrapper
                    key={link.children}
                    appearance="link"
                    className="flex w-fit items-center gap-8"
                  >
                    <Link href={link.href} target="_blank">
                      {link.children}
                    </Link>
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
      {button && (
        <InfoBlock.Root>
          <InfoBlock.Content className="flex w-full flex-col items-start gap-32">
            <Link href={button.href} target="_blank" className="">
              <Button
                appearance="outline"
                variant="primary"
                hasIcon
                trailingIcon="agora-line-arrow-right-circle"
                trailingIconHover="agora-line-arrow-right-circle"
              >
                {button.children}
              </Button>
            </Link>
          </InfoBlock.Content>
        </InfoBlock.Root>
      )}
    </Section>
  );
}
