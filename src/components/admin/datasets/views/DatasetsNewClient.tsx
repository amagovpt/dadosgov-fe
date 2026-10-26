"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import DatasetsAdminClient from "@/components/admin/datasets/publication-wizard/DatasetsAdminClient";
import AdminLayout from "@/components/Layout/AdminLayout";
import { DatasetContentProvider } from "../DatasetContentProvider";
import type { BoDatasetsPage } from "@/service/types/admin/datasets";
import { localizeHref } from "@/utils/localizeHref";
import { splitLocale } from "@/utils/stripLocale";
import { adminProfileBasePath, useActiveProfile } from "@/context/ActiveProfileContext";

interface DatasetsNewClientProps {
  pageContent: BoDatasetsPage;
  orgId?: string;
}

export default function DatasetsNewClient(props: DatasetsNewClientProps) {
  return (
    <DatasetContentProvider content={props.pageContent}>
      <DatasetsNewContent {...props} />
    </DatasetContentProvider>
  );
}

function DatasetsNewContent({ pageContent, orgId }: DatasetsNewClientProps) {
  const { t } = useTranslation("admin-datasets");
  const searchParams = useSearchParams();
  const router = useRouter();
  const { locale } = splitLocale(usePathname());
  const { activeProfile, isLoading: isProfileLoading } = useActiveProfile();
  const profile = orgId ? { type: "organization" as const, orgId } : activeProfile;
  const basePath = adminProfileBasePath(profile);
  const requestedStep = Number(searchParams.get("step"));
  const currentStep =
    Number.isInteger(requestedStep) && requestedStep >= 1 && requestedStep <= 4 ? requestedStep : 1;
  const datasetId = searchParams.get("datasetId");
  const creationId = searchParams.get("creationId");
  const pendingCreationId = useRef<string | null>(null);

  useEffect(() => {
    if (isProfileLoading) return;
    if (creationId) {
      pendingCreationId.current = null;
      return;
    }
    // A bare creation link starts a new attempt; its URL then survives reloads.
    pendingCreationId.current ??= crypto.randomUUID();
    const query = new URLSearchParams(searchParams);
    query.set("creationId", pendingCreationId.current);
    router.replace(localizeHref(`${basePath}/datasets/new?${query}`, locale));
  }, [basePath, creationId, isProfileLoading, locale, router, searchParams]);
  const listUrl = localizeHref(`${basePath}/datasets`, locale);
  const buildStepUrl = (step: number, id = datasetId) => {
    const query = new URLSearchParams({ step: String(step) });
    if (creationId) query.set("creationId", creationId);
    if (id) query.set("datasetId", id);
    return localizeHref(`${basePath}/datasets/new?${query}`, locale);
  };
  const pageTitle = pageContent.createHero?.title ?? "";

  if (isProfileLoading || !creationId) return null;

  return (
    <AdminLayout
      className={`${currentStep === 4 ? "gap-32" : "gap-64"} [&_.agora-btn]:py-[14px]`}
      titleClassName="text-primary-900"
      descriptionClassName="text-primary-900"
      breadcrumbClassName="[&_li:first-child>span]:border-b-2 [&_li:first-child>span]:border-neutral-900 [&_li:first-child>span]:py-2"
      breadcrumbItems={[
        { label: t("form.breadcrumbs.datasets"), url: listUrl },
        { label: pageTitle },
      ]}
      title={pageTitle}
      hideHeader={currentStep === 4}
      description={t(currentStep === 3 ? "resources.requiredFields" : "form.optionalFields")}
      headerAction={null}
      headerInfoClassName="max-w-[592px]"
    >
      <DatasetsAdminClient
        key={`${basePath}:${creationId}`}
        pageContent={pageContent}
        redesigned
        draftScope={basePath}
        creationId={creationId}
        initialProducerId={profile.type === "organization" ? profile.orgId : undefined}
        currentStep={currentStep}
        datasetId={datasetId}
        onNextStep={() => router.push(buildStepUrl(currentStep + 1))}
        onPreviousStep={() =>
          router.push(currentStep > 1 ? buildStepUrl(currentStep - 1) : listUrl)
        }
        onDatasetCreated={(id) => {
          router.push(buildStepUrl(currentStep + 1, id));
        }}
        onComplete={() => router.push(listUrl)}
      />
    </AdminLayout>
  );
}
