import type { Metadata } from "next";
import DataservicesClient from "@/components/admin/dataservices/views/DataservicesClient";
import initTranslations from "@/app/i18n";
import { getBoDataservices } from "@/service/queries/admin/dataservices";

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

export default async function DataservicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoDataservices(locale);

  return <DataservicesClient pageContent={pageContent} />;
}
