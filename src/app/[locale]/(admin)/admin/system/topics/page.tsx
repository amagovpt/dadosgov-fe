import type { Metadata } from "next";
import SystemTopicsClient from "@/components/admin/topics/SystemTopicsClient";
import initTranslations from "@/app/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await initTranslations({
    locale,
    namespaces: ["admin-topics"],
  });

  return {
    title: t("metadata.title", { ns: "admin-topics" }),
    description: t("metadata.description", { ns: "admin-topics" }),
  };
}

export default function SystemTopicsPage() {
  return <SystemTopicsClient />;
}
