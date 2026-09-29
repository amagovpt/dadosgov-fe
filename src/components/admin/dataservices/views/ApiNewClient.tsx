"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import ApiRegistrationClient from "@/components/admin/dataservices/views/ApiRegistrationClient";
import AdminLayout from "@/components/Layout/AdminLayout";
import { AdminStepper } from "@/components/admin/AdminStepper";
import { getAdminStepTitle } from "@/components/admin/getAdminStepTitle";
import type { BoDataservicesPage } from "@/service/types/admin/dataservices";

interface ApiNewClientProps {
  pageContent: BoDataservicesPage;
}

export default function ApiNewClient({ pageContent }: ApiNewClientProps) {
  const { t } = useTranslation(["admin-common", "admin-dataservices"]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const totalSteps = 3;
  const currentStep = Number(searchParams.get("step")) || 1;
  const pageTitle = pageContent.createHero?.title ?? "";
  const stepTitle = getAdminStepTitle(pageContent.steps?.[currentStep - 1]);

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: t("admin-dataservices:title"), url: "/admin/dataservices" },
        { label: pageTitle || t("admin-common:breadcrumbs.new") },
      ]}
      title={pageTitle}
    >
      <AdminStepper
        currentStep={currentStep}
        totalSteps={totalSteps}
        labelWord={t("admin-common:stepper.step")}
        stepTitle={stepTitle}
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
