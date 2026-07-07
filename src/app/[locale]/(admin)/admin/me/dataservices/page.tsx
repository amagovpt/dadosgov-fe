import type { Metadata } from "next";
import DataservicesClient from "@/components/admin/dataservices/views/DataservicesClient";
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
    title: t("metadata.listTitle", { ns: "admin-dataservices" }),
    description: t("metadata.listDescription", { ns: "admin-dataservices" }),
  };
}

export default function DataservicesPage() {
  return <DataservicesClient />;
}
