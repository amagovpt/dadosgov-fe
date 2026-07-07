"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button, CardAction } from "@ama-pt/agora-design-system";
import DatasetsAdminClient from "@/components/admin/datasets/publication-wizard/DatasetsAdminClient";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import AdminLayout from "@/components/Layout/AdminLayout";
import { AdminStepper } from "@/components/admin/AdminStepper";

export default function DatasetsNewClient() {
  const { t } = useTranslation(["admin-common", "admin-datasets"]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { displayName } = useCurrentUser();
  const totalSteps = 4;
  const currentStep = Number(searchParams.get("step")) || 1;
  const [createdDatasetId, setCreatedDatasetId] = useState<string | null>(
    searchParams.get("datasetId"),
  );
  const [sessionKey, setSessionKey] = useState(0);

  const buildStepUrl = (step: number, id?: string | null) => {
    const base = `/admin/datasets/new?step=${step}`;
    return id ? `${base}&datasetId=${id}` : base;
  };

  const stepTitles: Record<number, string> = {
    1: t("admin-datasets:form.steps.start"),
    2: t("admin-datasets:form.steps.describe"),
    3: t("admin-datasets:form.steps.files"),
    4: t("admin-datasets:form.steps.publish"),
  };

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: t("admin-common:breadcrumbs.administration"), url: "/admin" },
        { label: displayName || "...", url: "#" },
        { label: t("admin-datasets:form.breadcrumbs.datasets"), url: "/admin/me/datasets" },
      ]}
      title={t("admin-datasets:form.registrationTitle")}
    >
      {/* Stepper*/}
      <AdminStepper
        currentStep={currentStep}
        totalSteps={totalSteps}
        labelWord={t("admin-common:stepper.step")}
        labelFormat="slash"
        stepTitle={stepTitles[currentStep] || ""}
      />

      {currentStep === 1 && (
        <>
          <div className="admin-new-page__cards mb-32" style={{ maxWidth: "50%" }}>
            <CardAction
              variant="neutral-100"
              titleText={t("admin-datasets:form.startCardTitle")}
              descriptionText={t("admin-datasets:form.startCardDescription")}
              icon={{ name: "agora-line-edit" }}
              button={{
                children: t("admin-datasets:form.startCardAction"),
                variant: "primary",
                appearance: "outline",
                onClick: () => {
                  setSessionKey((k) => k + 1);
                  setCreatedDatasetId(null);
                  router.push("/admin/datasets/new?step=2");
                },
              }}
            />
          </div>

          {/* Admin sections */}
          <div className="admin-new-page__admin-sections">
            <div className="admin-new-page__admin-section">
              <p className="text-primary-900 text-base font-bold leading-7">
                {t("admin-datasets:form.adminAutomationTitle")}
              </p>
              <p className="text-neutral-700 text-sm leading-relaxed">
                {t("admin-datasets:form.adminAutomationDescription")}
              </p>
              <div className="flex gap-4 flex-wrap">
                <Button
                  appearance="link"
                  variant="primary"
                  hasIcon
                  trailingIcon="agora-line-external-link"
                  trailingIconHover="agora-solid-external-link"
                  onClick={() => router.push("/recursos/desenvolvimento/referencia-api")}
                >
                  {t("admin-datasets:form.apiDocsAction")}
                </Button>
                <Button
                  appearance="link"
                  variant="primary"
                  hasIcon
                  trailingIcon="agora-line-external-link"
                  trailingIconHover="agora-solid-external-link"
                  onClick={() => router.push("/ajuda-e-contactos")}
                >
                  {t("admin-datasets:form.contactAction")}
                </Button>
              </div>
            </div>

            <div className="admin-new-page__admin-section">
              <p className="text-primary-900 text-base font-bold leading-7">
                {t("admin-datasets:form.catalogTitle")}
              </p>
              <p className="text-neutral-700 text-sm leading-relaxed">
                {t("admin-datasets:form.catalogDescription")}
              </p>
              <div className="flex gap-4 flex-wrap"></div>
            </div>
          </div>
        </>
      )}

      {currentStep >= 2 && (
        <DatasetsAdminClient
          key={sessionKey}
          currentStep={currentStep}
          datasetId={createdDatasetId}
          onNextStep={() => router.push(buildStepUrl(currentStep + 1, createdDatasetId))}
          onPreviousStep={() => router.push(buildStepUrl(currentStep - 1, createdDatasetId))}
          onDatasetCreated={(id) => {
            setCreatedDatasetId(id);
            router.push(buildStepUrl(currentStep + 1, id));
          }}
          onComplete={() => router.push("/admin/me/datasets")}
        />
      )}
    </AdminLayout>
  );
}
