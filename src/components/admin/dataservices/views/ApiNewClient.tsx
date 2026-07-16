"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import ApiRegistrationClient from "@/components/admin/dataservices/views/ApiRegistrationClient";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import AdminLayout from "@/components/Layout/AdminLayout";
import { AdminStepper } from "@/components/admin/AdminStepper";
import type { BoDataservicesPage } from "@/service/types/admin/dataservices";

interface ApiNewClientProps {
  pageContent: BoDataservicesPage;
}

export default function ApiNewClient({ pageContent }: ApiNewClientProps) {
  const { t } = useTranslation(["admin-common", "admin-dataservices"]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { displayName } = useCurrentUser();
  const totalSteps = 3;
  const currentStep = Number(searchParams.get("step")) || 1;
  const stepTitles: Record<number, string> = {
    1: t("admin-dataservices:form.steps.describe"),
    2: t("admin-dataservices:form.steps.datasets"),
    3: t("admin-dataservices:form.steps.publish"),
  };

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: t("admin-common:breadcrumbs.administration"), url: "/admin" },
        { label: displayName || "...", url: "#" },
        { label: t("admin-dataservices:title"), url: "/admin/dataservices" },
      ]}
      title={t("admin-dataservices:form.registrationTitle")}
    >
      <AdminStepper
        currentStep={currentStep}
        totalSteps={totalSteps}
        labelWord={t("admin-common:stepper.step")}
        stepTitle={stepTitles[currentStep]}
      />

      <ApiRegistrationClient
        currentStep={currentStep}
        onNextStep={() =>
          router.push(`/admin/dataservices/new?step=${currentStep + 1}`)
        }
        onPreviousStep={() =>
          router.push(`/admin/dataservices/new?step=${currentStep - 1}`)
        }
        pageContent={pageContent}
      />
    </AdminLayout>
  );
}
