"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import ReusesFormClient from "@/components/admin/reuses/views/ReusesFormClient";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { AdminStepper } from "@/components/admin/AdminStepper";
import AdminLayout from "@/components/Layout/AdminLayout";

export default function ReusesNewClient() {
  const { t } = useTranslation(["admin-common", "admin-reuses"]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { displayName } = useCurrentUser();
  const totalSteps = 3;
  const currentStep = Number(searchParams.get("step")) || 1;

  const stepTitles: Record<number, string> = {
    1: t("admin-reuses:form.steps.describe"),
    2: t("admin-reuses:form.steps.datasets"),
    3: t("admin-reuses:form.steps.publish"),
  };

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: t("admin-common:breadcrumbs.administration"), url: "/admin" },
        { label: displayName || "...", url: "#" },
        { label: t("admin-reuses:title"), url: "/admin/me/reuses" },
      ]}
      title={t("admin-reuses:form.registrationTitle")}
    >
      <AdminStepper
        currentStep={currentStep}
        totalSteps={totalSteps}
        labelWord={t("admin-common:stepper.step")}
        labelFormat="slash"
        stepTitle={stepTitles[currentStep] || ""}
      />

      <ReusesFormClient
        currentStep={currentStep}
        onNextStep={() => router.push(`${pathname}?step=${currentStep + 1}`)}
        onPreviousStep={() => router.push(`${pathname}?step=${currentStep - 1}`)}
      />
    </AdminLayout>
  );
}
