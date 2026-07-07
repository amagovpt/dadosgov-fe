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
    namespaces: ["admin-datasets"],
  });

  return {
    title: t("metadata.orgListTitle", { ns: "admin-datasets" }),
    description: t("metadata.orgListDescription", { ns: "admin-datasets" }),
  };
}

export default function OrgDatasetsRedirect() {
  return <AdminOrgRedirect targetPath="/admin/org/{orgId}/datasets" />;
}
