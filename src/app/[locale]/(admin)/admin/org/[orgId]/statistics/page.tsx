import type { Metadata } from "next";
import OrgStatisticsClient from "@/components/admin/statistics/OrgStatisticsClient";
import initTranslations from "@/app/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; orgId: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await initTranslations({
    locale,
    namespaces: ["admin-statistics"],
  });

  return {
    title: t("metadata.organizationTitle", { ns: "admin-statistics" }),
    description: t("metadata.organizationDescription", { ns: "admin-statistics" }),
  };
}

export default async function OrgStatisticsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrgStatisticsClient orgId={orgId} />;
}
