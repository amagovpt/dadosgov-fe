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

// ----------------------------------------------------------------------------------------------------------------

export const MOCK: TimelineSection = {
  schemaName: "section-datastory-cards-steps",
  title: "section title",
  description: "section description",
  cards: [
    {
      icon: "",
      title: "card title 1",
      description:
        "card description 1 card description 1 card description 1 card description 1 card description 1 card description 1 card description 1",
    },
    {
      icon: "",
      title: "card title 2",
      description:
        "card description 2 card description 2 card description 2 card description 2 card description 2 card description 2 card description 2 card description 2 card description 2",
    },
    {
      icon: "",
      title: "card title 3",
      description:
        "card description 3 card description 3 card description 3 card description 3 card description 3 card description 3 card description 3 card description 3 card description 3 description 3 card description 3 card description 3",
    },
  ],
  cardsLinkIcon: "agora-line-chevron-right",
  anchor: {
    children: "button text",
    icon: "agora-line-arrow-right-circle",
    href: "",
  },
};

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
              <CardGeneral
                titleText={card.title}
                descriptionText={formatHtmlParagraphs(card.description) as string[]}
              />
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
  const { hide } = useModalContext();

  return (
    <TimelineVertical hideLabels={false}>
      <TimelineEvent label="2023" hasIcon icon="agora-line-calendar" altIcon="">
        <p className="mb-32 text-m-bold">
          Lorem ipsum dolor sit, amet consectetur adipisicing elit.
        </p>
        <p className="mb-8 text-m-bold">
          Reprehenderit veniam asperiores, fugiat perferendis unde laborum.
        </p>
        <span className="mb-128 text-m-regular">
          Lorem ipsum dolor sit amet consectetur, adipisicing elit. Reprehenderit veniam asperiores,
          fugiat perferendis unde laborum quis velit commodi fuga aperiam consequatur recusandae
          earum omnis quasi in, officia quod sit? Nulla.
        </span>
      </TimelineEvent>
      <TimelineEvent label="2023" hasIcon icon="agora-line-chevron-right" altIcon="">
        <p className="mb-32 text-m-bold">
          Lorem ipsum dolor sit, amet consectetur adipisicing elit.
        </p>
        <p className="mb-8 text-m-bold">
          Reprehenderit veniam asperiores, fugiat perferendis unde laborum.
        </p>
        <span className="mb-128 text-m-regular">
          Lorem ipsum dolor sit amet consectetur, adipisicing elit. Reprehenderit veniam asperiores,
          fugiat perferendis unde laborum quis velit commodi fuga aperiam consequatur recusandae
          earum omnis quasi in, officia quod sit? Nulla.
        </span>
      </TimelineEvent>
      <TimelineEvent label="2024" hasIcon icon="agora-line-chevron-right" altIcon="">
        <p className="mb-32 text-m-bold">
          Lorem ipsum dolor sit, amet consectetur adipisicing elit.
        </p>
        <p className="mb-8 text-m-bold">
          Reprehenderit veniam asperiores, fugiat perferendis unde laborum.
        </p>
        <span className="mb-128 text-m-regular">
          Lorem ipsum dolor sit amet consectetur, adipisicing elit. Reprehenderit veniam asperiores,
          fugiat perferendis unde laborum quis velit commodi fuga aperiam consequatur recusandae
          earum omnis quasi in, officia quod sit? Nulla.
        </span>
      </TimelineEvent>
    </TimelineVertical>
  );
}

// ----------------------------------------------------------------------------------------------------------------

export default function Timeline({
  className,
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
      title: "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
      closeButtonLabel: "Close",
      darkMode: true,
    } as ModalConfiguration);
  };

  return (
    <Section
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
            trailingIcon={anchor.icon}
            trailingIconHover={anchor.icon}
            onClick={handleOpenModal}
          >
            {anchor.children}
          </Button>
        </div>
      </InfoBlock.Content>
    </Section>
  );
}
