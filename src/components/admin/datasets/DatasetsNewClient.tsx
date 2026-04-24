"use client";

import React, { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Breadcrumb,
  Button,
  CardAction,
  StatusCard,
} from "@ama-pt/agora-design-system";
import DatasetsAdminClient from "@/components/admin/datasetsadmin/DatasetsAdminClient";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import PublishDropdown from "@/components/admin/PublishDropdown";

export default function DatasetsNewClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { displayName } = useCurrentUser();
  const totalSteps = 4;
  const currentStep = Number(searchParams.get("step")) || 1;
  const [createdDatasetId, setCreatedDatasetId] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState(0);

  const buildStepUrl = (step: number) => {
    return `/pages/admin/datasets/new?step=${step}`;
  };
  const totalSegments = 12;
  const displayStep = currentStep;
  const filledSegments = Math.round((displayStep / totalSteps) * totalSegments);

  return (
    <div className="admin-page">
      <div className="admin-page__breadcrumb">
        <Breadcrumb
          items={[
            { label: "Administração", url: "/pages/admin" },
            { label: displayName || "...", url: "#" },
            { label: "Conjuntos de dados", url: "/pages/admin/me/datasets" },
          ]}
        />
      </div>

      <div className="admin-page__header">
        <h1 className="admin-page__title">Formulário de publicação de um conjunto de dados</h1>
        <PublishDropdown />
      </div>

      {/* Step indicator */}
      <div className="admin-page__step-header">
        <p className="admin-page__step-text">
          <span className="text-primary-600 font-bold">Passo {currentStep} - </span>
          <span className="text-primary-900 font-bold">
            {currentStep === 1 && "Inicie a publicação do seu conjunto de dados"}
            {currentStep === 2 && "Descreva o seu conjunto de dados"}
            {currentStep === 3 && "Adicione os ficheiros"}
            {currentStep === 4 && "Finalize a publicação do seu conjunto de dados"}
          </span>
        </p>
      </div>

      {/* Progress bar */}
      <div className="admin-page__stepper">
        <div className="admin-page__stepper-bar">
          <div className="admin-page__stepper-mark admin-page__stepper-mark--start" />
          {Array.from({ length: totalSegments }).map((_, i) => (
            <div
              key={i}
              className={`admin-page__stepper-segment ${
                i < filledSegments ? "admin-page__stepper-segment--filled" : ""
              }`}
            />
          ))}
          <div className="admin-page__stepper-mark admin-page__stepper-mark--end" />
        </div>
        <span className="admin-page__stepper-label">
          Passo {displayStep}/{totalSteps}
        </span>
      </div>

      {currentStep === 1 && (
        <>
          <div className="datasets-new-page__cards mb-[32px]" style={{ maxWidth: "50%" }}>
            <CardAction
              variant="neutral-100"
              titleText="Publique um conjunto de dados"
              descriptionText="Seja uma entidade da administração pública ou uma empresa pública, todos podem publicar em dados.gov.pt!"
              icon={{ name: "agora-line-edit" }}
              button={{
                children: "Comece a publicação",
                variant: "primary",
                appearance: "outline",
                onClick: () => {
                setSessionKey((k) => k + 1);
                setCreatedDatasetId(null);
                router.push("/pages/admin/datasets/new?step=2");
              },
              }}
            />
          </div>

          {/* Admin sections */}
          <div className="datasets-new-page__admin-sections">
            <div className="datasets-new-page__admin-section">
              <p className="text-primary-900 text-base font-bold leading-7">
                É administrador e deseja automatizar a publicação dos seus dados?
              </p>
              <p className="text-neutral-700 text-sm leading-relaxed">
                Pode automatizar a publicação através da API ou ligando o seu portal ao dados.gov.pt
                através de um harvester de dados.
              </p>
              <div className="flex gap-4 flex-wrap">
                <Button
                  appearance="link"
                  variant="primary"
                  hasIcon
                  trailingIcon="agora-line-external-link"
                  trailingIconHover="agora-solid-external-link"
                  onClick={() => router.push("/pages/faqs/api-documentation")}
                >
                  Consulte a documentação da API
                </Button>
<Button
                  appearance="link"
                  variant="primary"
                  hasIcon
                  trailingIcon="agora-line-external-link"
                  trailingIconHover="agora-solid-external-link"
                  onClick={() => router.push("/pages/support")}
                >
                  Contacte-nos
                </Button>
              </div>
            </div>

            <div className="datasets-new-page__admin-section">
              <p className="text-primary-900 text-base font-bold leading-7">
                É administrador e deseja catalogar os seus dados?
              </p>
              <p className="text-neutral-700 text-sm leading-relaxed">
                Pode utilizar o serviço de catalogação e publicação do dados.gov.pt, que permite aos
                organismos da Administração Pública Central organizarem e disponibilizarem o seu
                catálogo de dados abertos.
              </p>
              <div className="flex gap-4 flex-wrap">
              </div>
            </div>
          </div>
        </>
      )}

      {currentStep >= 2 && (
        <DatasetsAdminClient
          key={sessionKey}
          currentStep={currentStep}
          datasetId={createdDatasetId}
          onNextStep={() => router.push(buildStepUrl(currentStep + 1))}
          onPreviousStep={() => router.push(buildStepUrl(currentStep - 1))}
          onDatasetCreated={(id) => {
            setCreatedDatasetId(id);
            router.push(buildStepUrl(currentStep + 1));
          }}
          onComplete={() => router.push("/pages/admin/me/datasets")}
        />
      )}
    </div>
  );
}
