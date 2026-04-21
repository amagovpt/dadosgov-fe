"use client";

import React from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { Breadcrumb } from "@ama-pt/agora-design-system";
import ReusesFormClient from "@/components/admin/reuses/ReusesFormClient";
import PublishDropdown from "@/components/admin/PublishDropdown";
import { useOrganizationName } from "@/hooks/useOrganizationName";

export default function OrgReusesNewClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const orgId = params?.orgId as string | undefined;
  const orgName = useOrganizationName(orgId);
  const totalSteps = 3;
  const currentStep = Number(searchParams.get("step")) || 1;
  const totalSegments = 12;
  const filledSegments = Math.round((currentStep / totalSteps) * totalSegments);

  const stepTitles: Record<number, string> = {
    1: "Descreva a sua reutilização",
    2: "Conectar conjuntos de dados e APIs",
    3: "Finalizar a publicação",
  };

  return (
    <div className="admin-page">
      <div className="admin-page__breadcrumb">
        <Breadcrumb
          items={[
            { label: "Administração", url: "/pages/admin" },
            { label: orgName || "Organização", url: "#" },
            { label: "Reutilizações", url: orgId ? `/pages/admin/org/${orgId}/reuses` : "#" },
          ]}
        />
      </div>

      <div className="admin-page__header">
        <h1 className="admin-page__title">Formulário de inscrição</h1>
        <PublishDropdown />
      </div>

      {/* Step indicator */}
      <div className="admin-page__step-header">
        <p className="admin-page__step-text">
          <span className="text-primary-600 font-bold">Passo {currentStep} - </span>
          <span className="text-primary-900 font-bold">
            {stepTitles[currentStep]}
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
          Passo {currentStep}/{totalSteps}
        </span>
      </div>

      <ReusesFormClient
        currentStep={currentStep}
        onNextStep={() =>
          router.push(`/pages/admin/org/reuses/new?step=${currentStep + 1}`)
        }
        onPreviousStep={() =>
          router.push(`/pages/admin/org/reuses/new?step=${currentStep - 1}`)
        }
      />
    </div>
  );
}
