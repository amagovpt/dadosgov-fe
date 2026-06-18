import { RelatedSection } from "@/service/types/datastories/datastory";
import Section from "../../Section";
import { InfoBlock } from "../../InfoBlock";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import { formatDateLong } from "@/utils/formatDate";
import CardGeneral from "@/components/Primitives/Cards/CardGeneral";

// ----------------------------------------------------------------------------------------------------------------

export type RelatedDatastoriesI = RelatedSection;

type DatastoryCardI = RelatedDatastoriesI["datastories"][number];

// ----------------------------------------------------------------------------------------------------------------

function DatastoryCard({ createdAt, title, description, slug }: DatastoryCardI) {
  return (
    <CardGeneral
      variant="white"
      isCardHorizontal={false}
      isBlockedLink={false}
      pillText="Datastory"
      subtitleText={`Publicado a ${formatDateLong(createdAt)}`}
      titleText={title}
      descriptionText={formatHtmlParagraphs(description) as string[]}
      anchor={{
        target: "_blank",
        href: `/pages/datastories/${slug}`,
        children: "",
        hasIcon: true,
        iconOnly: true,
        trailingIcon: "agora-line-arrow-right-circle",
        trailingIconHover: "agora-solid-arrow-right-circle",
        trailingIconActive: "agora-solid-arrow-right-circle",
      }}
    />
  );
}

// ----------------------------------------------------------------------------------------------------------------

export function RelatedDatastories({ title, description, datastories }: RelatedDatastoriesI) {
  return (
    <Section className="related-datastories flex w-full justify-center bg-primary-900 py-64">
      <InfoBlock.Root className="flex-col gap-32 lg:gap-64">
        <InfoBlock.Header className="w-full gap-16 lg:w-1/2">
          <InfoBlock.Title
            titleLevel="h2"
            title={title}
            className="text-2xl font-bold text-white"
          />
          <InfoBlock.Content className="flex">
            <InfoBlock.Description
              className="text-m-regular text-white"
              description={formatHtmlParagraphs(description) as string[]}
            />
          </InfoBlock.Content>
        </InfoBlock.Header>
        <InfoBlock.Content className="flex flex-col gap-32">
          <div className="grid grid-cols-12 gap-32">
            {datastories?.map((datastory, index) => {
              return (
                <div
                  className="col-span-12 h-full md:col-span-6 lg:col-span-4"
                  key={`bignumber-${index}`}
                >
                  <DatastoryCard {...datastory} />
                </div>
              );
            })}
          </div>
        </InfoBlock.Content>
      </InfoBlock.Root>
    </Section>
  );
}
