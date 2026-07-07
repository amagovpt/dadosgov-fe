import type { Metadata } from "next";
import AdminOrgRedirect from "@/components/admin/AdminOrgRedirect";
import initTranslations from "@/app/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; orgId: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await initTranslations({
    locale,
    namespaces: ["admin-datasets"],
  });

  return {
    title: t("metadata.orgNewTitle", { ns: "admin-datasets" }),
    description: t("metadata.orgNewDescription", { ns: "admin-datasets" }),
  };
}

export default function OrgDatasetsNewRedirect() {
  return (
    <AdminOrgRedirect
      targetPath="/admin/org/datasets/new"
      preserveSearchParams
      requireActiveOrganization={false}
    />
  );
}
