import type { Metadata } from "next";
import SystemReusesClient from "@/components/admin/reuses/views/SystemReusesClient";
import initTranslations from "@/app/i18n";
import { getBoReuses } from "@/service/queries/admin/reuses";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await initTranslations({
    locale,
    namespaces: ["admin-reuses"],
  });

  return {
    title: t("metadata.systemTitle", { ns: "admin-reuses" }),
    description: t("metadata.systemDescription", { ns: "admin-reuses" }),
  };
}

export default async function SystemReusesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoReuses(locale);

  return <SystemReusesClient pageContent={pageContent} />;
}
