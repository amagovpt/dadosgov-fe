import type { Metadata } from "next";
import SystemDatasetsClient from "@/components/admin/datasets/views/SystemDatasetsClient";
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
    title: t("metadata.systemTitle", { ns: "admin-datasets" }),
    description: t("metadata.systemDescription", { ns: "admin-datasets" }),
  };
}

export default async function SystemDatasetsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoDatasets(locale);

  return <SystemDatasetsClient pageContent={pageContent} />;
}
