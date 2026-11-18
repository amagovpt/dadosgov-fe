"use client";

import React from "react";
import { StatusCard, Toggle, ToggleGroup } from "@ama-pt/agora-design-system";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { useTranslation } from "react-i18next";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import { useSupportForm } from "./hooks/useSupportForm";
import { anchorFaqSections, shouldPreselectFeedbackFromUrl, SUPPORT_ANCHORS } from "./utils";
import { DatasetInfoCard } from "./components/DatasetInfoCard";
import { FaqSection } from "./components/FaqSection";
import { SupportForm } from "./components/SupportForm";
import { SupportHero } from "./components/SupportHero";
import { SupportSidebar } from "./components/SupportSidebar";
import type {
  AnchoredFaqCategory,
  SupportPageContent as SupportPageContentType,
} from "@/service/types/support";

interface SupportPageContentProps {
  pageContent: SupportPageContentType;
}

function getActiveItemFromHash(
  hash: string,
  faqSections: AnchoredFaqCategory[],
  currentAnchorId: string,
  helpAnchorId: string
) {
  if (!hash) return null;
  if (hash === currentAnchorId || hash === helpAnchorId) return hash;

  // A hash can name a category or one of its questions; either way the category is active.
  const section = faqSections.find(
    (section) => section.id === hash || section.items.some((item) => item.anchor === hash)
  );
  return section?.id ?? null;
}

function getHashSnapshot() {
  return decodeURIComponent(window.location.hash.replace(/^#/, ""));
}

function getServerHashSnapshot() {
  return "";
}

function subscribeToHashChange(onStoreChange: () => void) {
  window.addEventListener("hashchange", onStoreChange);
  return () => window.removeEventListener("hashchange", onStoreChange);
}

export function SupportPageContent({ pageContent }: SupportPageContentProps) {
  const { t } = useTranslation("support");
  const { executeRecaptcha } = useGoogleReCaptcha();
  const currentAnchorId = SUPPORT_ANCHORS.currentPage;
  const helpAnchorId = SUPPORT_ANCHORS.help;
  const faqSections = React.useMemo(
    () =>
      anchorFaqSections(pageContent.faqSections ?? [], pageContent.faqAnchorSources)
        .filter((section) => section.enabled !== false)
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => item.enabled !== false),
        })),
    [pageContent.faqSections, pageContent.faqAnchorSources]
  );

  const hash = React.useSyncExternalStore(
    subscribeToHashChange,
    getHashSnapshot,
    getServerHashSnapshot
  );
  const activeItem =
    getActiveItemFromHash(hash, faqSections, currentAnchorId, helpAnchorId) ??
    (shouldPreselectFeedbackFromUrl() ? helpAnchorId : currentAnchorId);
  const form = useSupportForm({ executeRecaptcha });
  // below the lg breakpoint (1024px) the toggles no longer fits side by side.
  const isToggleGroupVertical = useMediaQuery("(max-width: 1023px)");
  const toggleOrientation = isToggleGroupVertical ? "vertical" : "horizontal";

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
    <main id={currentAnchorId} className="grow scroll-mt-[200px]! bg-white pb-64">
      <SupportHero content={pageContent.hero} />

      <div className="container mx-auto px-32 py-64">
        <div className="grid grid-cols-1 gap-32 md:grid-cols-12">
          <div className="h-fit self-start md:sticky md:top-[190px] md:order-2 md:col-span-4">
            <SupportSidebar
              activeItem={activeItem}
              categories={faqSections}
              currentAnchorId={currentAnchorId}
              currentLabel={t("sidebar.currentPage")}
              helpAnchorId={helpAnchorId}
              helpLabel={pageContent.helpCard.title ?? t("help.title")}
            />
          </div>

          <div className="max-w-ch md:order-1 md:col-span-8">
            <FaqSection
              title={t("faq.title")}
              updatedDate={pageContent.faqUpdatedDate}
              categories={faqSections}
              hash={hash}
            />
          </div>
        </div>

        <div className="mt-80 border-neutral-200 pt-64">
          <h2
            id={helpAnchorId}
            className="mb-24 scroll-mt-[200px]! text-24 font-bold text-[#021C51]"
          >
            {pageContent.helpCard.title}
          </h2>
          <h3 className="mb-16 text-[20px] font-medium text-[#021C51]">
            {pageContent.helpCard.subtitle}
          </h3>

          <div className="mb-8 text-base text-neutral-800">
            {formatHtmlParagraphs(
              pageContent.helpCard.description ?? "",
              "text-[16px] text-neutral-800"
            )}
          </div>
          <p className="mb-24 text-base text-neutral-800">{t("help.optionIntro")}</p>

          <ToggleGroup
            key={toggleOrientation}
            orientation={toggleOrientation}
            multiple={false}
            value={form.selectedToggle ?? ""}
            onChange={handleToggleChange}
            className="w-full lg:w-auto"
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
