import { twMerge } from "tailwind-merge";
import Section from "../../Section";
import { InfoBlock } from "../../InfoBlock";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import Button from "@/components/Primitives/Button";
import { TimelineSection } from "@/service/types/datastories/datastory";
import { Fragment } from "react/jsx-runtime";
import CardGeneral from "@/components/Primitives/Cards/CardGeneral";
import AppIcon from "@/components/Primitives/AppIcon";
import {
  ModalConfiguration,
  TimelineEvent,
  TimelineVertical,
  useModalContext,
} from "@ama-pt/agora-design-system";
import { Typograph } from "../../Generics/Typograph";

// ----------------------------------------------------------------------------------------------------------------

export type CardsStepsI = TimelineSection & { className?: string };

type CardsContentI = {
  cards: CardsStepsI["cards"];
  cardsLinkIcon: CardsStepsI["cardsLinkIcon"];
};

type TimelineModalI = CardsStepsI["timeline"];

// ----------------------------------------------------------------------------------------------------------------

function CardsContent({ cards, cardsLinkIcon }: CardsContentI) {
  return (
    <div className="flex w-full flex-col items-start gap-0 lg:flex-row">
      {cards.map((card, index) => {
        const isLastCard = index >= cards.length - 1;
        return (
          <Fragment key={`card-step-${index}`}>
            <div className="flex-1">
              <CardGeneral titleText={card.title} descriptionText={card.subtitle} />
            </div>
            {!isLastCard && (
              <AppIcon name={cardsLinkIcon} className="rotate-90 self-center lg:rotate-0" />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

// ----------------------------------------------------------------------------------------------------------------

function TimelineModal({ title, description, events }: TimelineModalI) {
  return (
    <div className="datastory-modal flex flex-col gap-64">
      <div className="ml-0 flex max-w-[592px] flex-col gap-16 lg:ml-128">
        <Typograph tag="h2" className="text-2xl-bold text-white">
          {title}
        </Typograph>
        <Typograph tag="div" className="flex flex-col gap-8 text-m-regular text-white">
          {formatHtmlParagraphs(description) as string[]}
        </Typograph>
      </div>
      <TimelineVertical hideLabels={false}>
        {events.map((e, index) => {
          return (
            <TimelineEvent
              key={`event-${index}`}
              label={e.label}
              hasIcon
              icon={e.icon ?? (index === 0 ? "agora-line-calendar" : "agora-line-chevron-right")}
              altIcon=""
            >
              <Typograph tag="h3" className="mb-32 text-m-bold text-white">
                {e.title}
              </Typograph>
              <Typograph tag="div" className="flex flex-col gap-8 text-m-regular text-white">
                {formatHtmlParagraphs(e.description) as string[]}
              </Typograph>
            </TimelineEvent>
          );
        })}
      </TimelineVertical>
    </div>
  );
}

// ----------------------------------------------------------------------------------------------------------------

export default function Timeline({
  className,
  id,
  title,
  description,
  cards,
  cardsLinkIcon,
  anchor,
  timeline,
}: CardsStepsI) {
  const { show } = useModalContext();

  const handleOpenModal = () => {
    show(<TimelineModal {...timeline} />, {
      title: timeline.title,
      closeButtonLabel: "Fechar",
      darkMode: true,
    } as ModalConfiguration);
  };

  return (
    <Section
      id={id}
      className={twMerge(
        "flex flex-col items-center justify-center gap-32 bg-white py-64",
        className
      )}
    >
      <InfoBlock.Root className={"gap-32"}>
        <InfoBlock.Header className="w-full gap-16 lg:w-1/2">
          <InfoBlock.Title
            titleLevel="h2"
            title={title}
            className="text-2xl font-bold text-primary-900"
          />
          <InfoBlock.Description
            className="whitespace-pre-wrap text-m-light text-black"
            description={formatHtmlParagraphs(description) as string[]}
          />
        </InfoBlock.Header>
      </InfoBlock.Root>
      <InfoBlock.Content className="container flex flex-col gap-32">
        <CardsContent cards={cards} cardsLinkIcon={cardsLinkIcon} />
        <div className="h-auto w-auto">
          <Button
            appearance="outline"
            hasIcon
            trailingIcon={anchor.icon ?? "agora-line-arrow-right-circle"}
            trailingIconHover={anchor.icon ?? "agora-line-arrow-right-circle"}
            onClick={handleOpenModal}
          >
            {anchor.children}
          </Button>
        </div>
      </InfoBlock.Content>
    </Section>
  );
}
