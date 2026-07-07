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
    namespaces: ["admin-reuses"],
  });

  return {
    title: t("metadata.orgEditTitle", { ns: "admin-reuses" }),
    description: t("metadata.orgEditDescription", { ns: "admin-reuses" }),
  };
}

export default function OrgReusesEditRedirect() {
  return <AdminOrgRedirect targetPath="/admin/org/{orgId}/reuses/edit" preserveSearchParams />;
}
