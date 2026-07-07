import type { Metadata } from "next";
import DataservicesEditClient from "@/components/admin/dataservices/views/DataservicesEditClient";
import initTranslations from "@/app/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await initTranslations({
    locale,
    namespaces: ["admin-dataservices"],
  });

  return {
    title: t("metadata.editTitle", { ns: "admin-dataservices" }),
    description: t("metadata.editDescription", { ns: "admin-dataservices" }),
  };
}

export default function DataservicesEditPage() {
  return <DataservicesEditClient />;
}
