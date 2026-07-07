"use client";

import React, { useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button, CardAction, StatusCard } from "@ama-pt/agora-design-system";
import DatasetsAdminClient from "@/components/admin/datasets/publication-wizard/DatasetsAdminClient";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useAuth } from "@/context/AuthContext";
import { AdminStepper } from "@/components/admin/AdminStepper";
import AdminLayout from "@/components/Layout/AdminLayout";

export default function OrgDatasetsNewClient() {
  const { t } = useTranslation(["admin-common", "admin-datasets"]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const routeParams = useParams();
  const routeOrgId = routeParams?.orgId as string | undefined;
  const { activeOrg } = useActiveOrganization();
  const resolvedOrgId = routeOrgId || activeOrg?.id;
  const { user } = useAuth();
  const orgName = useViewedOrganizationName(resolvedOrgId, user?.organizations);
  const totalSteps = 4;
  const currentStep = Number(searchParams.get("step")) || 1;
  const [createdDatasetId, setCreatedDatasetId] = useState<string | null>(null);

  const orgBase = activeOrg ? `/admin/org/${activeOrg.id}` : "/admin/org";

  const buildStepUrl = (step: number) => {
    return `/admin/org/datasets/new?step=${step}`;
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
        { label: orgName || t("admin-common:breadcrumbs.organization"), url: "#" },
        {
          label: t("admin-datasets:form.breadcrumbs.datasets"),
          url: resolvedOrgId ? `/admin/org/${resolvedOrgId}/datasets` : "#",
        },
      ]}
      title={t("admin-datasets:form.registrationTitle")}
    >
      <>
        {/* Stepper */}
        <AdminStepper
          currentStep={currentStep}
          totalSteps={totalSteps}
          labelWord={t("admin-common:stepper.step")}
          labelFormat="slash"
          stepTitle={stepTitles[currentStep] || ""}
        />

        {currentStep === 1 && (
          <>
            <h2 className="admin-page__section-title mb-16">
              {t("admin-datasets:form.publicationTypeTitle")}
            </h2>

            <StatusCard
              variant="informative"
              showIcon
              description={t("admin-datasets:form.demoInfo")}
            />

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
                  onClick: () => router.push(buildStepUrl(2)),
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
                    onClick={() => router.push("/recursos/como-usar-o-portal/como-reutilizar-dados")}
                  >
                    {t("admin-datasets:form.harvesterAction")}
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
                <div className="flex gap-4 flex-wrap">
                  <Button
                    appearance="link"
                    variant="primary"
                    hasIcon
                    trailingIcon="agora-line-external-link"
                    trailingIconHover="agora-solid-external-link"
                  >
                    {t("admin-datasets:form.catalogAction")}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {currentStep >= 2 && (
          <DatasetsAdminClient
            currentStep={currentStep}
            datasetId={createdDatasetId}
            onNextStep={() => router.push(buildStepUrl(currentStep + 1))}
            onPreviousStep={() => router.push(buildStepUrl(currentStep - 1))}
            onDatasetCreated={(id) => {
              setCreatedDatasetId(id);
              router.push(buildStepUrl(currentStep + 1));
            }}
            onComplete={() => router.push(`${orgBase}/datasets`)}
          />
        )}
      </>
    </AdminLayout>
  );
}
