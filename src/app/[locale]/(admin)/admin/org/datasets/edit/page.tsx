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
    title: t("metadata.orgEditTitle", { ns: "admin-datasets" }),
    description: t("metadata.orgEditDescription", { ns: "admin-datasets" }),
  };
}

export default function OrgDatasetsEditRedirect() {
  return (
    <AdminOrgRedirect targetPath="/admin/org/{orgId}/datasets/edit" preserveSearchParams />
  );
}
