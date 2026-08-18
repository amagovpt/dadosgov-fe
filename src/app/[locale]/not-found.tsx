"use client";
import ButtonNavigate from "@/components/Primitives/ButtonNavigate";
import InputSearchBar from "@/components/Primitives/InputSearchBar";
import Pill from "@/components/Primitives/Pill";
import SearchDropdown from "@/components/search/SearchDropdown";
import { Typograph } from "@/components/Shared/Generics/Typograph";
import { Hero } from "@/components/Shared/Hero";
import { InfoBlock } from "@/components/Shared/InfoBlock";
import Section from "@/components/Shared/Section";
import Image from "next/image";
import { useTranslation } from "react-i18next";


export default function NotFound() {
  const { t } = useTranslation();

  return (
    <main className="w-full h-full flex flex-col gap-64">
      <Hero.Root backgroundImageUrl={null}>
        <div className="w-full flex md:flex-row flex-col justify-center md:justify-stretch  gap-32">
          <Hero.Content>
            <Image src={"/Icons/question-mark.svg"} alt="404" width={300} height={300} />
          </Hero.Content>
          <Hero.Content>
            <div className="flex flex-col gap-16 h-full justify-center">
              <Pill variant="primary" size="large" appearance="solid" className="!text-neutral-900 !bg-secondary-200">
                {t("notFound.error")}
              </Pill>
              <Hero.Title>{t("notFound.title")}</Hero.Title>
              <Hero.Description description={
                <div className="flex flex-col gap-16 w-full">
                  <span className="!text-m-bold !text-white">
                    {t("notFound.subtitle")}
                  </span>
                  <span className="!text-m-regular !text-white">
                    {t("notFound.description")}
                  </span>
                </div>
              } />
            </div>
          </Hero.Content>
        </div>
      </Hero.Root>
      <Section className="flex flex-col items-center gap-128" id={"404"}>
        <InfoBlock.Root className="flex flex-col gap-16">
          <InfoBlock.Header className="w-full md:w-1/2">
            <Typograph tag="h3" className="text-l-bold">
              {t("notFound.whatAreYouLookingFor")}
            </Typograph>
          </InfoBlock.Header>
          <div className="w-full flex items-center justify-between flex-col xl:flex-row gap-16 xl:gap-0 mb-128">
            <div
              id="not-found-search-bar"
              className="w-full xl:w-2/3 flex-shrink-0"
            >
              <SearchDropdown
                id="404-search" placeholder={t("header.searchPlaceholder")}
                classname="[&_.input-search-bar-container]:!border-0 py-0 w-full"
                label=""
              />

            </div>
            <div className="w-[30%] flex xl:justify-center">
              <ButtonNavigate leadingIcon="agora-line-arrow-left-circle" leadingIconHover="agora-solid-arrow-left-circle" hasIcon href="/" variant="primary" appearance="solid">
                {t("notFound.backToHome")}
              </ButtonNavigate>
            </div>
          </div>
        </InfoBlock.Root>
      </Section>
    </main>
  );
}
