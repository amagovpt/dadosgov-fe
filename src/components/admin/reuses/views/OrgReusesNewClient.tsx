"use client";

import { useSearchParams, useRouter, useParams, usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import ReusesFormClient from "@/components/admin/reuses/views/ReusesFormClient";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useAuth } from "@/context/AuthContext";
import { AdminStepper } from "@/components/admin/AdminStepper";
import AdminLayout from "@/components/Layout/AdminLayout";
import type { BoReusesPage } from "@/service/types/admin/reuses";

interface OrgReusesNewClientProps {
  pageContent: BoReusesPage;
}

export default function OrgReusesNewClient({ pageContent }: OrgReusesNewClientProps) {
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
  const pageTitle = pageContent.hero?.title ?? "";

  const stepTitle = pageContent.orgSteps?.[currentStep - 1]?.title ?? "";

  return (
    <AdminLayout breadcrumbItems={[
      { label: t("admin-common:breadcrumbs.administration"), url: "/admin" },
      { label: orgName || t("admin-common:breadcrumbs.organization"), url: "#" },
      { label: t("admin-reuses:title"), url: orgId ? `/admin/org/${orgId}/reuses` : "#" }
    ]}
      title={pageTitle}
    >

      {/* Stepper */}
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
