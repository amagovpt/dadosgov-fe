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
    title: t("metadata.orgRedirectTitle", { ns: "admin-reuses" }),
    description: t("metadata.orgRedirectDescription", { ns: "admin-reuses" }),
  };
}

export default function OrgReusesRedirect() {
  return <AdminOrgRedirect targetPath="/admin/org/{orgId}/reuses" />;
}
