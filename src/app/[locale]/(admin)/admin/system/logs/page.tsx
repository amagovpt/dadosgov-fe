import type { Metadata } from "next";
import SystemLogsClient from "@/components/admin/logs/SystemLogsClient";
import initTranslations from "@/app/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await initTranslations({
    locale,
    namespaces: ["admin-logs"],
  });

  return {
    title: t("metadata.title", { ns: "admin-logs" }),
    description: t("metadata.description", { ns: "admin-logs" }),
  };
}

export default function SystemLogsPage() {
  return <SystemLogsClient />;
}
