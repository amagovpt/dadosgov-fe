"use client";

import { useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import DatasetsAdminClient from "@/components/admin/datasets/publication-wizard/DatasetsAdminClient";
import AdminLayout from "@/components/Layout/AdminLayout";
import type { BoDatasetsPage } from "@/service/types/admin/datasets";
import { localizeHref } from "@/utils/localizeHref";
import { splitLocale } from "@/utils/stripLocale";

interface DatasetsNewClientProps {
  pageContent: BoDatasetsPage;
}

export default function DatasetsNewClient({ pageContent }: DatasetsNewClientProps) {
  const { t } = useTranslation("admin-datasets");
  const searchParams = useSearchParams();
  const router = useRouter();
  const { locale } = splitLocale(usePathname());
  const requestedStep = Number(searchParams.get("step"));
  const currentStep =
    Number.isInteger(requestedStep) && requestedStep >= 1 && requestedStep <= 4 ? requestedStep : 1;
  const [createdDatasetId, setCreatedDatasetId] = useState<string | null>(
    searchParams.get("datasetId")
  );
  const datasetId = createdDatasetId ?? searchParams.get("datasetId");
  const listUrl = localizeHref("/admin/me/datasets", locale);
  const buildStepUrl = (step: number, id = datasetId) => {
    const query = new URLSearchParams({ step: String(step) });
    if (id) query.set("datasetId", id);
    return localizeHref(`/admin/me/datasets/new?${query}`, locale);
  };
  const pageTitle = t("form.createTitle");

  return (
    <AdminLayout
      className={[
        "max-w-[1112px]! gap-64",
        "[&_h1]:text-primary-900 [&_h1+p]:leading-7 [&_h1+p]:text-primary-900",
        "[&_.agora-breadcrumb-desktop_li:first-child>span]:border-b-2 [&_.agora-breadcrumb-desktop_li:first-child>span]:border-neutral-900 [&_.agora-breadcrumb-desktop_li:first-child>span]:py-2",
        "[&_.agora-btn]:min-h-60! [&_.agora-btn]:py-[14px]",
        "[&_[data-dataset-actions]]:w-full [&_[data-dataset-actions]]:justify-between!",
        "[&_.input-label-wrapper]:mb-8 [&_.input-label-wrapper_label]:text-m-medium [&_.input-label-wrapper_label]:text-primary-900",
        "max-md:[&_.grid-cols-2]:grid-cols-1 [&_textarea.agora-input-textarea]:h-[108px]! [&_textarea.agora-input-textarea]:min-h-[108px]!",
      ].join(" ")}
      breadcrumbItems={[
        { label: t("form.breadcrumbs.datasets"), url: listUrl },
        { label: pageTitle },
      ]}
      title={pageTitle}
      description={t("form.optionalFields")}
      headerAction={null}
      headerInfoClassName="max-w-[592px]"
    >
      <DatasetsAdminClient
        pageContent={pageContent}
        redesigned
        currentStep={currentStep}
        datasetId={datasetId}
        onNextStep={() => router.push(buildStepUrl(currentStep + 1))}
        onPreviousStep={() =>
          router.push(currentStep > 1 ? buildStepUrl(currentStep - 1) : listUrl)
        }
        onDatasetCreated={(id) => {
          setCreatedDatasetId(id);
          router.push(buildStepUrl(currentStep + 1, id));
        }}
        onComplete={() => router.push(listUrl)}
      />
    </AdminLayout>
  );
}
