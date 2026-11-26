"use client";

import Breadcrumb from "../../Primitives/Breadcrumb/Breadcrumb";
import { InfoBlock } from "../InfoBlock";
import Section from "../Section";
import {
  DatastoryHeroModal,
  DatastoryHero as DatastoryHeroType,
} from "@/service/types/datastories/datastory";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import DatastoryIndex from "./DatastoryIndex";
import { BreadcrumbItem } from "@/service/types/shared/breadcrumbItem";
import { twJoin } from "tailwind-merge";
import { Typograph } from "../Generics/Typograph";
import Button from "@/components/Primitives/Button";
import { ModalConfiguration, useModalContext } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";

function ModalContent({ modal }: { modal: DatastoryHeroModal }) {
  return (
    <div className="flex items-center justify-center">
      <div className="flex max-w-[592px] flex-col gap-64">
        <div className="flex flex-col gap-16">
          <Typograph tag="h2" className="text-2xl-bold whitespace-pre-wrap text-white">
            {modal.title}
          </Typograph>
          <Typograph tag="p" className="text-m-regular whitespace-pre-wrap text-white">
            {modal.subtitle}
          </Typograph>
        </div>
        <div className="flex flex-col gap-16 text-white [&_p]:text-l-bold">
          {formatHtmlParagraphs(modal.description)}
        </div>
      </div>
    </div>
  );
}

export type DatastoryHeroI = DatastoryHeroType & {
  breadcrumbs: BreadcrumbItem[];
  className?: string;
};

export default function DatastoryHero({
  breadcrumbs,
  pretitle,
  title,
  description,
  index,
  modal,
  className,
}: DatastoryHeroI) {
  const { t } = useTranslation("common");
  const { show } = useModalContext();

  const openModalHandler = () => {
    if (modal) {
      show(<ModalContent modal={modal} />, {
        title: modal.title,
        closeButtonLabel: t("close"),
        darkMode: true,
      } as ModalConfiguration);
    }
  };

  return (
    <Section className={twJoin("flex items-center justify-center bg-primary-900", className)}>
      <InfoBlock.Root className="pt-64 pb-96">
        <InfoBlock.Header>
          <Breadcrumb items={breadcrumbs} darkMode />
        </InfoBlock.Header>
        <InfoBlock.Content className="flex w-full flex-col justify-between gap-32 lg:flex-row lg:gap-[136px]">
          <div className="info-datastory flex w-full flex-col lg:w-1/2">
            {pretitle && (
              <Typograph tag="p" className="mb-8 text-m-regular whitespace-pre-wrap text-white">
                {pretitle}
              </Typograph>
            )}
            <InfoBlock.Title titleLevel="h1" title={title} className="text-3xl-bold text-white" />
            {description && (
              <InfoBlock.Description
                className="mt-32 text-m-regular whitespace-pre-wrap text-white"
                classNameContent="flex flex-col gap-32"
                description={formatHtmlParagraphs(description) as string[]}
              />
            )}
            {modal && (
              <Button
                variant="neutral"
                appearance="link"
                darkMode
                hasIcon
                trailingIcon="agora-line-arrow-right-circle"
                trailingIconHover="agora-line-arrow-right-circle"
                onClick={() => openModalHandler()}
                className="mt-32 w-fit px-0"
              >
                {modal.button}
              </Button>
            )}
          </div>
          <div className="datastory-index flex-1 xl:self-center">
            <DatastoryIndex {...index} />
          </div>
        </InfoBlock.Content>
      </InfoBlock.Root>
    </Section>
  );
}
