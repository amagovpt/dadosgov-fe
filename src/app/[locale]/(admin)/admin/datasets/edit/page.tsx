import type { Metadata } from "next";
import DatasetsEditClient from "@/components/admin/datasets/views/DatasetsEditClient";
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
    title: t("metadata.editTitle", { ns: "admin-datasets" }),
    description: t("metadata.editDescription", { ns: "admin-datasets" }),
  };
}

export default function DatasetsEditPage() {
  return <DatasetsEditClient />;
}
