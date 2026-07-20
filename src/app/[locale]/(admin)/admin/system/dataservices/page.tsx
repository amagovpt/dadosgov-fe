import type { Metadata } from "next";
import SystemDataservicesClient from "@/components/admin/dataservices/views/SystemDataservicesClient";
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
    title: t("metadata.systemTitle", { ns: "admin-dataservices" }),
    description: t("metadata.systemDescription", { ns: "admin-dataservices" }),
  };
}

export default async function SystemDataservicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoDataservices(locale);

  return <SystemDataservicesClient pageContent={pageContent} />;
}
