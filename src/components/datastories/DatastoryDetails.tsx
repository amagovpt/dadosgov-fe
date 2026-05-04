
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import { Datastory } from "@/types/datastories/datastory";
import Section from "../Shared/Section";
import { InfoBlock } from "../Shared/InfoBlock";
import { CardCompound } from "../Shared/CardCompound";
import FooterReference from "../Shared/FooterReference";
import DataSourcesSection from "../Shared/DataSourcesSection";

export type DatastoryDetailsProps = {
  datastory: Datastory;
};

export default function DatastoryDetails({ datastory }: DatastoryDetailsProps) {
  return (
    <main className="flex flex-col">
      <Section className="bg-primary-900 flex items-center justify-center ">
        <InfoBlock.Root className="py-[96px]">
          <InfoBlock.Header>
            <InfoBlock.Title
              titleLevel="h1"
              title={datastory.hero.title}
              className="text-white text-3xl-bold "
            />
          </InfoBlock.Header>
          <InfoBlock.Content className="flex min-[1280px]:flex-row flex-col justify-between min-[1280px]:gap-[136px] gap-32">
            <InfoBlock.Description
              className="whitespace-pre-wrap text-m-regular text-white"
              description={formatHtmlParagraphs(datastory.hero.description) as string[]}
            />
            <div className="w-full h-full flex flex-col gap-[128px] py-[44px]">
              <div className="flex flex-col gap-64">
                {datastory.hero.cards.map((card, index) => (
                  <CardCompound.Root key={index}>
                    {card.card?.icon && <CardCompound.Icon icon={card.card.icon} />}
                    {card.card?.bignumber && (
                      <CardCompound.BigNumber
                        number={card.card.bignumber.number}
                        detail={card.card.bignumber.description}
                      />
                    )}
                    <CardCompound.Subtitle>{card.card?.title}</CardCompound.Subtitle>
                    <CardCompound.Description>{card.card?.subtitle}</CardCompound.Description>
                  </CardCompound.Root>
                ))}
              </div>
              <FooterReference
                text="Ano de referência"
                period={datastory.hero.dateReference?.date}
              />
            </div>
          </InfoBlock.Content>
        </InfoBlock.Root>
      </Section>

      {datastory.sections.map((section, index) => (
        <Section
          className={"flex flex-col items-center justify-center gap-[64px] bg-white"}
          key={index}
        >
          <InfoBlock.Root className={"pt-64 gap-64"}>
            <InfoBlock.Header className="gap-16">
              <InfoBlock.Title
                titleLevel="h2"
                title={section.title}
                className="text-2xl font-bold text-primary-900"
              />
              <InfoBlock.Description
                className="whitespace-pre-wrap text-m-light text-black max-w-[500px] "
                description={formatHtmlParagraphs(section.description) as string[]}
              />
            </InfoBlock.Header>
          </InfoBlock.Root>
          <div className="w-full flex flex-col items-center justify-center gap-[128px] pt-[32px]  bg-primary-100">
            <div className="container -mb-[54px]">
              <InfoBlock.IFrame
                src={section.iframeSource}
                className={
                  "min-[1440px]:!h-[800px] min-[1024px]:!h-[610px] min-[768px]:!h-[470px] min-[425px]:!h-[310px] min-[375px]:!h-[285px] min-[320px]:!h-[285px]"
                }
              />
            </div>
          </div>
        </Section>
      ))}

      <DataSourcesSection {...datastory.dataSource} />
    </main>
  );
}
