import type { Metadata } from "next";
import SystemDataservicesClient from "@/components/admin/dataservices/views/SystemDataservicesClient";
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
    title: t("metadata.systemTitle", { ns: "admin-dataservices" }),
    description: t("metadata.systemDescription", { ns: "admin-dataservices" }),
  };
}

export default function SystemDataservicesPage() {
  return <SystemDataservicesClient />;
}
