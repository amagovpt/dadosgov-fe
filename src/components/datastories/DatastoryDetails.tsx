import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import { Datastory } from "@/types/datastories/datastory";
import Section from "../Shared/Section";
import { InfoBlock } from "../Shared/InfoBlock";
import { CardCompound } from "../Shared/CardCompound";
import FooterReference from "../Shared/FooterReference";
import DataSourcesSection from "../Shared/DataSourcesSection";
import Breadcrumb from "../Primitives/Breadcrumb/Breadcrumb";
import { BreadcrumbItem } from "@/types/shared";

export type DatastoryDetailsProps = {
  breadcrumbItems: BreadcrumbItem[];
  datastory: Datastory;
};

export default function DatastoryDetails({ breadcrumbItems, datastory }: DatastoryDetailsProps) {
  return (
    <main className="flex flex-col">
      <Section className="flex items-center justify-center bg-primary-900">
        <InfoBlock.Root className="py-96">
          <InfoBlock.Header>
            <Breadcrumb items={breadcrumbItems} darkMode />
            <InfoBlock.Title
              titleLevel="h1"
              title={datastory.hero.title}
              className="text-3xl-bold text-white"
            />
          </InfoBlock.Header>
          <InfoBlock.Content className="flex flex-col justify-between gap-32 min-[1280px]:flex-row min-[1280px]:gap-[136px]">
            <InfoBlock.Description
              className="whitespace-pre-wrap text-m-regular text-white"
              classNameContent="flex flex-col gap-32"
              description={formatHtmlParagraphs(datastory.hero.description) as string[]}
            />
            <div className="flex h-full w-full flex-col gap-128">
              <div className="flex flex-col gap-64">
                {datastory.hero.cards.map((card, index) => (
                  <CardCompound.Root key={index}>
                    {card?.icon && <CardCompound.Icon icon={card.icon} />}
                    {card?.bignumber ? (
                      <CardCompound.BigNumber
                        number={card.bignumber.number}
                        detail={card.bignumber.description}
                      />
                    ) : (
                      <div className="h-16 w-full" />
                    )}
                    <CardCompound.Subtitle>{card?.title}</CardCompound.Subtitle>
                    {card?.subtitle && (
                      <CardCompound.Description>{card?.subtitle}</CardCompound.Description>
                    )}
                    {card.anchor && (
                      <CardCompound.Anchor href={card.anchor.href} className="py-16">
                        {card.anchor.children}
                      </CardCompound.Anchor>
                    )}
                  </CardCompound.Root>
                ))}
              </div>
              {datastory.hero.dateReference && (
                <FooterReference
                  text={`${datastory.hero.dateReference?.date.includes("-") || datastory.hero.dateReference?.date.includes(" ") ? "Período" : "Ano"} de referência`}
                  period={datastory.hero.dateReference?.date}
                />
              )}
            </div>
          </InfoBlock.Content>
        </InfoBlock.Root>
      </Section>

      {datastory.sections.map((section, index) => (
        <Section
          className={"flex flex-col items-center justify-center gap-64 bg-white"}
          key={index}
        >
          <InfoBlock.Root className={"gap-64 pt-64"}>
            <InfoBlock.Header className="gap-16">
              <InfoBlock.Title
                titleLevel="h2"
                title={section.title}
                className="text-2xl font-bold text-primary-900"
              />
              <InfoBlock.Description
                className="max-w-[500px] whitespace-pre-wrap text-m-light text-black"
                description={formatHtmlParagraphs(section.description) as string[]}
              />
            </InfoBlock.Header>
          </InfoBlock.Root>
          <div className="flex w-full flex-col items-center justify-center gap-128 bg-primary-100 pt-32">
            <div className="container -mb-[54px]">
              {section.iframe.map((iframe) => {
                return (
                  <InfoBlock.IFrame
                    key={`iframe-${index}`}
                    src={iframe.source}
                    className={iframe.classNames}
                  />
                );
              })}
            </div>
          </div>
        </Section>
      ))}

      <DataSourcesSection {...datastory.dataSource} />
    </main>
  );
}
