import type { Metadata } from "next";
import StatisticsClient from "@/components/admin/statistics/StatisticsClient";
import initTranslations from "@/app/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await initTranslations({
    locale,
    namespaces: ["admin-statistics"],
  });

  return {
    title: t("metadata.userTitle", { ns: "admin-statistics" }),
    description: t("metadata.userDescription", { ns: "admin-statistics" }),
  };
}

export default function StatisticsPage() {
  return <StatisticsClient />;
}
