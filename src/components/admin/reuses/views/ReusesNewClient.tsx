"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import ReusesFormClient from "@/components/admin/reuses/views/ReusesFormClient";
import { AdminStepper } from "@/components/admin/AdminStepper";
import { getAdminStepTitle } from "@/components/admin/getAdminStepTitle";
import AdminLayout from "@/components/Layout/AdminLayout";
import { adminProfileBasePath, useActiveProfile } from "@/context/ActiveProfileContext";
import type { BoReusesPage } from "@/service/types/admin/reuses";

interface ReusesNewClientProps {
  pageContent: BoReusesPage;
}

export default function ReusesNewClient({ pageContent }: ReusesNewClientProps) {
  const { t } = useTranslation(["admin-common", "admin-reuses"]);
  const { activeProfile } = useActiveProfile();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const totalSteps = 3;
  const currentStep = Number(searchParams.get("step")) || 1;
  const pageTitle = pageContent.createHero?.title ?? "";

  const stepTitle = getAdminStepTitle(pageContent.steps?.[currentStep - 1]);

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: t("admin-reuses:title"), url: `${adminProfileBasePath(activeProfile)}/reuses` },
        { label: pageTitle || t("admin-common:breadcrumbs.new") },
      ]}
      title={pageTitle}
    >
      <AdminStepper
        currentStep={currentStep}
        totalSteps={totalSteps}
        labelWord={t("admin-common:stepper.step")}
        labelFormat="slash"
        stepTitle={stepTitle}
      />

      <ReusesFormClient
        pageContent={pageContent}
        currentStep={currentStep}
        onNextStep={() => router.push(`${pathname}?step=${currentStep + 1}`)}
        onPreviousStep={() => router.push(`${pathname}?step=${currentStep - 1}`)}
      />
    </AdminLayout>
  );
}
