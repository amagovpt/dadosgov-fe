"use client";

import React from "react";
import { ToggleGroup, Toggle, StatusCard } from "@ama-pt/agora-design-system";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { useSupportForm } from "./hooks/useSupportForm";
import { shouldPreselectFeedbackFromUrl } from "./utils";
import { SupportHero } from "./components/SupportHero";
import { FaqSection } from "./components/FaqSection";
import { SupportSidebar } from "./components/SupportSidebar";
import { SupportForm } from "./components/SupportForm";
import { DatasetInfoCard } from "./components/DatasetInfoCard";

export function SupportPageContent() {
  const { executeRecaptcha } = useGoogleReCaptcha();

  const [activeItem, setActiveItem] = React.useState(() =>
    shouldPreselectFeedbackFromUrl() ? "Ajuda" : "Nesta página"
  );

  const form = useSupportForm({ executeRecaptcha });

  const handleToggleChange = (val: string[]) => {
    const selected = val.length > 0 ? val[0] : null;
    form.resetFormFields();
    form.setSelectedToggle(selected);
    form.setSuccessMessage("");
    form.setErrorMessage("");
  };

  return (
    <main id="nesta-pagina" className="flex-grow !scroll-mt-[200px] bg-white pb-64">
      <SupportHero />

      <div className="container mx-auto px-4 py-64">
        <div className="grid gap-32 md:grid-cols-3 xl:grid-cols-12">
          <div className="max-w-ch xl:col-span-8 xl:block">
            <FaqSection />
          </div>

          <div className="sticky top-[190px] h-fit self-start xl:col-span-4 xl:block">
            <SupportSidebar activeItem={activeItem} onItemClick={setActiveItem} />
          </div>
        </div>

        <div id="ajuda" className="mt-80 border-neutral-200 pt-64">
          <h2 className="mb-24 text-24 font-bold text-[#021C51]">Ajuda</h2>
          <h3 className="mb-16 text-[20px] font-[500] text-[#021C51]">
            Não encontrou o que procurava?
          </h3>

          <p className="mb-8 text-[16px] text-neutral-800">
            Antes de nos contactar, consulte as Perguntas Frequentes e a área de Conhecimento do
            dados.gov.pt. A sua questão poderá já estar respondida nos conteúdos disponíveis sobre
            dados abertos, publicação de datasets, reutilização de dados, metadados, licenças e
            funcionamento do portal.
          </p>
          <p className="mb-24 text-[16px] text-neutral-800">
            Caso ainda necessite de apoio, selecione a opção mais adequada:
          </p>

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
              Tenho uma pergunta
            </Toggle>
            <Toggle
              value="bug"
              leadingIcon="agora-line-alert-triangle"
              leadingIconHover="agora-solid-alert-triangle"
              hasIcon={true}
            >
              Reportar um problema
            </Toggle>
            <Toggle
              value="feedback"
              leadingIcon="agora-line-chat"
              leadingIconHover="agora-solid-chat"
              hasIcon={true}
            >
              Envie o seu feedback
            </Toggle>
            <Toggle
              value="dataset"
              leadingIcon="agora-line-plus-circle"
              leadingIconHover="agora-solid-plus-circle"
              hasIcon={true}
            >
              Pedir um dataset
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
            />
          )}

          {form.selectedToggle === "dataset" && <DatasetInfoCard />}

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
