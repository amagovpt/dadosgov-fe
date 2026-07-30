"use client";

import React from "react";
import { StatusCard, Toggle, ToggleGroup } from "@ama-pt/agora-design-system";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { useTranslation } from "react-i18next";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import { useSupportForm } from "./hooks/useSupportForm";
import { shouldPreselectFeedbackFromUrl } from "./utils";
import { DatasetInfoCard } from "./components/DatasetInfoCard";
import { FaqSection } from "./components/FaqSection";
import { SupportForm } from "./components/SupportForm";
import { SupportHero } from "./components/SupportHero";
import { SupportSidebar } from "./components/SupportSidebar";
import type { SupportPageContent as SupportPageContentType } from "@/service/types/support";

interface SupportPageContentProps {
  pageContent: SupportPageContentType;
}

export function SupportPageContent({ pageContent }: SupportPageContentProps) {
  const { t } = useTranslation("support");
  const { executeRecaptcha } = useGoogleReCaptcha();
  const faqSections = React.useMemo(
    () => (pageContent.faqSections ?? []).filter((section) => section.enabled !== false),
    [pageContent.faqSections]
  );

  const [activeItem, setActiveItem] = React.useState(() =>
    shouldPreselectFeedbackFromUrl() ? "help" : "current"
  );

  const form = useSupportForm({ executeRecaptcha });

  const handleToggleChange = (val: string[]) => {
    const selected = val.length > 0 ? val[0] : null;
    form.resetFormFields();
    form.setSelectedToggle(selected);
    form.setSuccessMessage("");
    form.setErrorMessage("");
  };
  const selectedInfoCard =
    form.selectedToggle === "question"
      ? pageContent.questionInfoCard
      : form.selectedToggle === "feedback"
        ? pageContent.feedbackInfoCard
        : null;

  return (
    <main id="nesta-pagina" className="flex-grow bg-white pb-64">
      <SupportHero content={pageContent.hero} />

      <div className="container mx-auto px-4 py-64">
        <div className="grid gap-32 md:grid-cols-3 xl:grid-cols-12">
          <div className="max-w-ch xl:col-span-8 xl:block">
            <FaqSection
              title={t("faq.title")}
              updatedDate={pageContent.faqUpdatedDate}
              categories={faqSections}
            />
          </div>

          <div className="sticky top-[190px] h-fit self-start xl:col-span-4 xl:block">
            <SupportSidebar
              activeItem={activeItem}
              categories={faqSections}
              currentLabel={t("sidebar.currentPage")}
              helpLabel={pageContent.helpCard.title ?? t("help.title")}
              onItemClick={setActiveItem}
            />
          </div>
        </div>

        <div id="help" className="mt-80 scroll-mt-[190px] border-neutral-200 pt-64">
          <h2 className="mb-24 text-24 font-bold text-[#021C51]">
            {pageContent.helpCard.title}
          </h2>
          <h3 className="mb-16 text-[20px] font-[500] text-[#021C51]">
            {pageContent.helpCard.subtitle}
          </h3>

          <div className="mb-8 text-[16px] text-neutral-800">
            {formatHtmlParagraphs(
              pageContent.helpCard.description ?? "",
              "text-[16px] text-neutral-800"
            )}
          </div>
          <p className="mb-24 text-[16px] text-neutral-800">{t("help.optionIntro")}</p>

          <ToggleGroup
            multiple={false}
            value={form.selectedToggle ?? ""}
            onChange={handleToggleChange}
          >
            <Toggle
              value="question"
              leadingIcon="agora-line-question-mark"
              leadingIconHover="agora-solid-question-mark"
              hasIcon={true}
            >
              {t("toggles.question")}
            </Toggle>
            <Toggle
              value="bug"
              leadingIcon="agora-line-alert-triangle"
              leadingIconHover="agora-solid-alert-triangle"
              hasIcon={true}
            >
              {t("toggles.bug")}
            </Toggle>
            <Toggle
              value="feedback"
              leadingIcon="agora-line-chat"
              leadingIconHover="agora-solid-chat"
              hasIcon={true}
            >
              {t("toggles.feedback")}
            </Toggle>
            <Toggle
              value="dataset"
              leadingIcon="agora-line-plus-circle"
              leadingIconHover="agora-solid-plus-circle"
              hasIcon={true}
            >
              {t("toggles.dataset")}
            </Toggle>
          </ToggleGroup>

          {form.selectedToggle && form.selectedToggle !== "dataset" && (
            <SupportForm
              selectedToggle={form.selectedToggle}
              email={form.email}
              subjectBody={form.subjectBody}
              description={form.description}
              category={form.category}
              problemUrl={form.problemUrl}
              problemDateTime={form.problemDateTime}
              errors={form.errors}
              errorMessage={form.errorMessage}
              isSubmitting={form.isSubmitting}
              setEmail={form.setEmail}
              setSubjectBody={form.setSubjectBody}
              setDescription={form.setDescription}
              setCategory={form.setCategory}
              setProblemUrl={form.setProblemUrl}
              setProblemDateTime={form.setProblemDateTime}
              setErrors={form.setErrors}
              handleSubmit={form.handleSubmit}
              infoCard={selectedInfoCard}
            />
          )}

          {form.selectedToggle === "dataset" && (
            <DatasetInfoCard cards={pageContent.datasetRequestCards ?? []} />
          )}

          {form.successMessage && (
            <div className="mt-32 max-w-2xl">
              <StatusCard variant="success" description={form.successMessage} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
