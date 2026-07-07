import type { Metadata } from "next";
import DatasetsAdminClient from "@/components/admin/datasets/publication-wizard/DatasetsAdminClient";
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
    title: t("metadata.wizardTitle", { ns: "admin-datasets" }),
    description: t("metadata.wizardDescription", { ns: "admin-datasets" }),
  };
}

export default function DatasetsAdminPage() {
  return <DatasetsAdminClient />;
}
