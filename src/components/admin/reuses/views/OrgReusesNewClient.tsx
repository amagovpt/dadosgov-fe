"use client";

import { useSearchParams, useRouter, useParams, usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import ReusesFormClient from "@/components/admin/reuses/views/ReusesFormClient";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useAuth } from "@/context/AuthContext";
import { AdminStepper } from "@/components/admin/AdminStepper";
import AdminLayout from "@/components/Layout/AdminLayout";

export default function OrgReusesNewClient() {
  const { t } = useTranslation(["admin-common", "admin-reuses"]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const orgId = params?.orgId as string | undefined;
  const { user } = useAuth();
  const orgName = useViewedOrganizationName(orgId, user?.organizations);
  const totalSteps = 3;
  const currentStep = Number(searchParams.get("step")) || 1;

  const stepTitles: Record<number, string> = {
    1: t("admin-reuses:form.steps.describe"),
    2: t("admin-reuses:form.steps.datasetsAndApis"),
    3: t("admin-reuses:form.steps.publish"),
  };

  return (
    <AdminLayout breadcrumbItems={[
      { label: t("admin-common:breadcrumbs.administration"), url: "/admin" },
      { label: orgName || t("admin-common:breadcrumbs.organization"), url: "#" },
      { label: t("admin-reuses:title"), url: orgId ? `/admin/org/${orgId}/reuses` : "#" }
    ]}
      title={t("admin-reuses:form.registrationTitle")}
    >

      {/* Stepper */}
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
