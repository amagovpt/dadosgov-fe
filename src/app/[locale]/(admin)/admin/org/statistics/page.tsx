import type { Metadata } from "next";
import AdminOrgRedirect from "@/components/admin/AdminOrgRedirect";
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
    title: t("metadata.organizationRedirectTitle", { ns: "admin-statistics" }),
    description: t("metadata.organizationRedirectDescription", { ns: "admin-statistics" }),
  };
}

export default function OrgStatisticsRedirect() {
  return <AdminOrgRedirect targetPath="/admin/org/{orgId}/statistics" />;
}
