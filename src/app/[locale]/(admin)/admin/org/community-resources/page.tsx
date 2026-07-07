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
    namespaces: ["admin-community-resources"],
  });

  return {
    title: t("metadata.orgRedirectTitle", { ns: "admin-community-resources" }),
    description: t("metadata.orgRedirectDescription", { ns: "admin-community-resources" }),
  };
}

export default function OrgCommunityResourcesRedirect() {
  return <AdminOrgRedirect targetPath="/admin/org/{orgId}/community-resources" />;
}
