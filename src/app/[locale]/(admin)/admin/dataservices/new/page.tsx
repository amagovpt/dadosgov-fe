import type { Metadata } from "next";
import ApiNewClient from "@/components/admin/dataservices/views/ApiNewClient";
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
    title: t("metadata.newTitle", { ns: "admin-dataservices" }),
    description: t("metadata.newDescription", { ns: "admin-dataservices" }),
  };
}

export default function ApiRegistrationPage() {
  return <ApiNewClient />;
}
