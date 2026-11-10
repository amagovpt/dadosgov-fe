import { RelatedSection } from "@/service/types/datastories/datastory";
import Section from "../../Section";
import { InfoBlock } from "../../InfoBlock";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import { formatDateLong } from "@/utils/formatDate";
import CardGeneral from "@/components/Primitives/Cards/CardGeneral";
import { useTranslation } from "react-i18next";
import { MetricItem } from "@/components/Shared/MetricItem";
import { useDatastoriesViews } from "@/hooks/useDatastoriesViews";

// ----------------------------------------------------------------------------------------------------------------

export type RelatedDatastoriesI = RelatedSection;

type DatastoryCardI = RelatedDatastoriesI["datastories"][number] & {
  /** Left out (undefined) until the section's counts arrive, or if they fail. */
  views?: number;
};

// ----------------------------------------------------------------------------------------------------------------

function DatastoryCard({ createdAt, title, description, slug, views }: DatastoryCardI) {
  const { t, i18n } = useTranslation("common");
  const paragraphs = formatHtmlParagraphs(description) as string[];

  return (
    <CardGeneral
      variant="white"
      isCardHorizontal={false}
      isBlockedLink={false}
      pillText="Datastory"
      subtitleText={t("publishedAt", {
        date: formatDateLong(createdAt, i18n.language as "pt" | "en"),
      })}
      titleText={title}
      // CardGeneral has no other slot that takes React nodes, so the metric follows the
      // description, in spans like everywhere MetricItem sits inside text.
      descriptionText={
        views === undefined ? (
          paragraphs
        ) : (
          <>
            {paragraphs}
            <span className="mt-16 flex">
              <MetricItem icon="agora-line-eye" value={views} label={t("card.views")} />
            </span>
          </>
        )
      }
      anchor={{
        target: "_blank",
        href: `/datastories/${slug}`,
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

export function RelatedDatastories({ id, title, description, datastories }: RelatedDatastoriesI) {
  // One request for the whole section, not one per card.
  const views = useDatastoriesViews(datastories.map((datastory) => datastory.slug));

  return (
    <Section
      id={id}
      className="related-datastories flex w-full justify-center bg-primary-900 py-64"
    >
      <InfoBlock.Root
        className={
          datastories.length === 1
            ? "flex-col gap-32 lg:flex-row lg:justify-between"
            : "flex-col gap-32 lg:gap-64"
        }
      >
        <InfoBlock.Header className="w-full gap-16 lg:w-2/5">
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

        {datastories.length === 1 && (
          <div className="w-full lg:w-1/3">
            <DatastoryCard {...datastories[0]} views={views?.[datastories[0].slug]} />
          </div>
        )}

        {datastories.length > 1 && (
          <InfoBlock.Content className="flex flex-col gap-32">
            <div className="grid grid-cols-12 gap-32">
              {datastories?.map((datastory, index) => {
                return (
                  <div
                    className="col-span-12 h-full md:col-span-6 lg:col-span-4"
                    key={`bignumber-${index}`}
                  >
                    <DatastoryCard {...datastory} views={views?.[datastory.slug]} />
                  </div>
                );
              })}
            </div>
          </InfoBlock.Content>
        )}
      </InfoBlock.Root>
    </Section>
  );
}
