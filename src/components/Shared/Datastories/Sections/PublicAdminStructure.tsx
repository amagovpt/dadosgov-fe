import { twMerge } from "tailwind-merge";
import Section from "../../Section";
import { InfoBlock } from "../../InfoBlock";
import { PublicAdminStructureSection } from "@/service/types/datastories/datastory";
import AppIcon from "@/components/Primitives/AppIcon";
import { Typograph } from "../../Generics/Typograph";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

// ----------------------------------------------------------------------------------------------------------------

export type PublicAdminStructureI = PublicAdminStructureSection & { className?: string };

type PublicAdminCardsI = PublicAdminStructureI["parts"];

type PublicAdminCardI = PublicAdminCardsI[
  | "centralAdmin"
  | "regionalAdmin"
  | "localAdmin"
  | "socialFunds"
  | "publicAdmin"] & { classNameIconContainer?: string };

// ----------------------------------------------------------------------------------------------------------------

function PublicAdminCard({
  icon,
  title,
  subtitle,
  description,
  classNameIconContainer,
}: PublicAdminCardI) {
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div
        className={twMerge(
          "mb-8 h-fit w-fit rounded-full border-2 border-primary-200 p-16",
          classNameIconContainer
        )}
      >
        <AppIcon name={icon} className="h-24 w-24" />
      </div>
      <Typograph tag="h3" className="text-center text-l-bold text-primary-900">
        {title}
      </Typograph>
      <Typograph tag="p" className="text-center text-m-light text-primary-900">
        {subtitle}
      </Typograph>
      {description && (
        <>
          <div className="min-h-88 w-0 flex-1 border-l border-dashed border-l-neutral-700 lg:min-h-[170px]" />
          <AppIcon name={"agora-line-info-mark"} className="h-22 w-22 fill-primary-600" />
          <Typograph tag="div" className="text-center text-m-light text-neutral-800">
            {formatHtmlParagraphs(description) as string[]}
          </Typograph>
        </>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------------------------------------------

function PublicAdminCards({
  centralAdmin,
  regionalAdmin,
  localAdmin,
  socialFunds,
  publicAdmin,
}: PublicAdminCardsI) {
  return (
    <div className="flex flex-col gap-32">
      <div className="flex flex-col">
        <div className="flex flex-col gap-64 lg:flex-row">
          <PublicAdminCard {...centralAdmin} />
          <PublicAdminCard {...regionalAdmin} />
          <PublicAdminCard {...localAdmin} />
        </div>
        <div className="hidden w-[70.5%] self-center lg:block">
          <div className="relative mt-8 h-64 border-b border-l border-r border-dashed border-neutral-700">
            <div className="absolute bottom-0 left-1/2 h-64 w-0 border-l border-dashed border-neutral-700" />
          </div>
          <div className="relative h-[193px] border-r border-dashed border-neutral-700">
            <div className="absolute right-0 top-1/2 h-fit w-fit -translate-y-1/2 translate-x-1/2 rounded-full bg-primary-600 p-16">
              <AppIcon name={"agora-line-arrow-down-anchor"} className="h-24 w-24 fill-white" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-64 lg:flex-row">
        <PublicAdminCard {...socialFunds} />
        <div className="relative h-[193px] w-0 self-center border-r border-t-0 border-dashed border-neutral-700 lg:h-0 lg:w-full lg:border-r-0 lg:border-t">
          <div className="absolute right-0 top-1/2 h-fit w-fit -translate-y-1/2 translate-x-1/2 rounded-full bg-primary-600 p-16 lg:right-1/2 lg:top-0">
            <AppIcon
              name={"agora-line-arrow-right-anchor"}
              className="h-24 w-24 rotate-90 fill-white lg:rotate-0"
            />
          </div>
        </div>
        <PublicAdminCard {...publicAdmin} classNameIconContainer="bg-primary-200" />
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------------------------------------------

export default function PublicAdminStructure({
  className,
  id,
  title,
  parts,
}: PublicAdminStructureI) {
  return (
    <Section
      id={id}
      className={twMerge(
        "flex flex-col items-center justify-center gap-64 bg-white py-64",
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
        </InfoBlock.Header>
      </InfoBlock.Root>
      <InfoBlock.Content className="container flex flex-col">
        <PublicAdminCards {...parts} />
      </InfoBlock.Content>
    </Section>
  );
}
