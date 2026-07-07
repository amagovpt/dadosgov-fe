import type { Metadata } from "next";
import { Suspense } from "react";
import OrgDatasetsNewClient from "@/components/admin/datasets/views/OrgDatasetsNewClient";
import initTranslations from "@/app/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await initTranslations({
    locale,
    namespaces: ["admin-datasets"],
  });

  return {
    title: t("metadata.orgNewTitle", { ns: "admin-datasets" }),
    description: t("metadata.orgNewDescription", { ns: "admin-datasets" }),
  };
}

export default function OrgDatasetsNewPage() {
  return (
    <Suspense>
      <OrgDatasetsNewClient />
    </Suspense>
  );
}
