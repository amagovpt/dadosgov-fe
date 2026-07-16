import type { Metadata } from "next";
import DatasetsEditClient from "@/components/admin/datasets/views/DatasetsEditClient";
import initTranslations from "@/app/i18n";
import { getBoDatasets } from "@/service/queries/admin/datasets";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; datasetId: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await initTranslations({
    locale,
    namespaces: ["admin-datasets"],
  });

  return {
    title: t("metadata.editTitle", { ns: "admin-datasets" }),
    description: t("metadata.editDescription", { ns: "admin-datasets" }),
  };
}

export default async function DatasetPage({
  params,
}: {
  params: Promise<{ locale: string; datasetId: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoDatasets(locale);

  return <DatasetsEditClient pageContent={pageContent} />;
}
