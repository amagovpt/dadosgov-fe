import type { Metadata } from "next";
import { Suspense } from "react";
import DatasetsClient from "@/components/admin/datasets/views/DatasetsClient";
import initTranslations from "@/app/i18n";
import { getBoDatasets } from "@/service/queries/admin/datasets";

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
    title: t("metadata.listTitle", { ns: "admin-datasets" }),
    description: t("metadata.listDescription", { ns: "admin-datasets" }),
  };
}

export default async function DatasetsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoDatasets(locale);

  return (
    <Suspense>
      <DatasetsClient pageContent={pageContent} />
    </Suspense>
  );
}
