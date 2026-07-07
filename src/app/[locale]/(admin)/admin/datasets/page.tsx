import type { Metadata } from "next";
import DatasetsClient from "@/components/admin/datasets/views/DatasetsClient";
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
    title: t("metadata.listTitle", { ns: "admin-datasets" }),
    description: t("metadata.listDescription", { ns: "admin-datasets" }),
  };
}

export default function DatasetsPage() {
  return <DatasetsClient />;
}
