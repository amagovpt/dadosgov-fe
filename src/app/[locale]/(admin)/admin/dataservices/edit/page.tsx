import type { Metadata } from "next";
import DataservicesEditClient from "@/components/admin/dataservices/views/DataservicesEditClient";
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
    title: t("metadata.editTitle", { ns: "admin-dataservices" }),
    description: t("metadata.editDescription", { ns: "admin-dataservices" }),
  };
}

export default async function DataservicesEditPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoDataservices(locale);

  return <DataservicesEditClient pageContent={pageContent} />;
}
